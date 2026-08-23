import { Chess } from 'chess.js'
import { db, type StoredGame } from '@/shared/db/db'
import { fetchLichessGames, type LichessGame } from '@/shared/api/lichess'
import { fetchChesscomGames, type ChesscomGame } from '@/shared/api/chesscom'

const lower = (s?: string) => (s ?? '').toLowerCase()

export function fromLichessGame(g: LichessGame, username: string): StoredGame | null {
  const white = g.players.white.user?.name ?? (g.players.white.aiLevel ? `Stockfish ${g.players.white.aiLevel}` : 'Anonymous')
  const black = g.players.black.user?.name ?? (g.players.black.aiLevel ? `Stockfish ${g.players.black.aiLevel}` : 'Anonymous')
  const userColor = lower(white) === lower(username) ? 'w' : lower(black) === lower(username) ? 'b' : null
  if (!userColor || !g.moves) return null
  const result = g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : g.status && ['draw', 'stalemate'].includes(g.status) ? '1/2-1/2' : g.status === 'started' ? '*' : '1/2-1/2'
  return { id: `lichess:${g.id}`, source: 'lichess', url: `https://lichess.org/${g.id}`, white, black, whiteRating: g.players.white.rating, blackRating: g.players.black.rating, result, speed: g.speed ?? g.perf ?? 'rapid', playedAt: g.createdAt, opening: g.opening ? `${g.opening.eco} ${g.opening.name}` : undefined, moves: g.moves, userColor, analysed: false, reviewed: false }
}

/** Strip PGN headers/comments/NAGs/results and return SAN moves. */
export function sanMovesFromPgn(pgn: string): { moves: string; headers: Record<string, string> } {
  const headers: Record<string, string> = {}
  for (const m of pgn.matchAll(/^\[(\w+)\s+"([^"]*)"\]/gm)) headers[m[1]] = m[2]
  const body = pgn.replace(/^\[.*\]\s*$/gm, '').replace(/\{[^}]*\}/g, '').replace(/\([^)]*\)/g, '').replace(/\$\d+/g, '')
  const tokens = body.split(/\s+/).filter((t) => t && !/^\d+\.+$/.test(t) && !['1-0', '0-1', '1/2-1/2', '*'].includes(t)).map((t) => t.replace(/^\d+\.+/, ''))
  const c = new Chess()
  const ok: string[] = []
  for (const t of tokens) { try { ok.push(c.move(t).san) } catch { break } }
  return { moves: ok.join(' '), headers }
}

export function fromChesscomGame(g: ChesscomGame, username: string): StoredGame | null {
  const userColor = lower(g.white.username) === lower(username) ? 'w' : lower(g.black.username) === lower(username) ? 'b' : null
  if (!userColor) return null
  const { moves, headers } = sanMovesFromPgn(g.pgn)
  if (!moves) return null
  const result = (headers.Result as StoredGame['result']) ?? '*'
  const id = g.url.split('/').pop() ?? String(g.end_time)
  return { id: `chesscom:${id}`, source: 'chesscom', url: g.url, white: g.white.username, black: g.black.username, whiteRating: g.white.rating, blackRating: g.black.rating, result, speed: g.time_class, playedAt: g.end_time * 1000, opening: headers.ECOUrl?.split('/').pop()?.replace(/-/g, ' ') ?? headers.ECO, moves, userColor, analysed: false, reviewed: false }
}

export function fromPgn(pgn: string, userColor: 'w' | 'b'): StoredGame | null {
  const { moves, headers } = sanMovesFromPgn(pgn)
  if (!moves) return null
  const id = `pgn:${hash(moves)}`
  return { id, source: 'pgn', white: headers.White ?? 'White', black: headers.Black ?? 'Black', result: (headers.Result as StoredGame['result']) ?? '*', speed: headers.TimeControl ?? 'unknown', playedAt: headers.Date ? Date.parse(headers.Date.replace(/\./g, '-')) || Date.now() : Date.now(), opening: headers.Opening ?? headers.ECO, moves, userColor, analysed: false, reviewed: false }
}
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }

/** Import recent games for both connected accounts; returns number of new games stored. */
export async function importRecent(lichessUser: string, chesscomUser: string, max = 20): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = []
  const games: StoredGame[] = []
  if (lichessUser) { try { for (const g of await fetchLichessGames(lichessUser, max)) { const s = fromLichessGame(g, lichessUser); if (s) games.push(s) } } catch (e) { errors.push((e as Error).message) } }
  if (chesscomUser) { try { for (const g of await fetchChesscomGames(chesscomUser, max)) { const s = fromChesscomGame(g, chesscomUser); if (s) games.push(s) } } catch (e) { errors.push((e as Error).message) } }
  let added = 0
  for (const g of games) { if (!(await db.games.get(g.id))) { await db.games.add(g); added++ } }
  return { added, errors }
}
