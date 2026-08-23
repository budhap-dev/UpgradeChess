import { Chess } from 'chess.js'
import type { Engine } from '@/shared/engine/engine'
import type { ErrorCategory, GameError, MoveEval, StoredGame } from '@/shared/db/db'

/** Lichess-style centipawn → win probability (0–100) for the side the cp is measured for. */
export function winPct(cp: number): number {
  const c = Math.max(-1000, Math.min(1000, cp))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1)
}
export const MATE_CP = 1000
export const cpFromScore = (cp?: number, mate?: number) => (mate != null ? (mate > 0 ? MATE_CP : -MATE_CP) : cp ?? 0)

export function severityFor(lossPct: number): GameError['severity'] | null {
  if (lossPct >= 30) return 'blunder'
  if (lossPct >= 20) return 'mistake'
  if (lossPct >= 10) return 'inaccuracy'
  return null
}

/** opening: first 10 full moves or still in book; endgame: no queens or ≤ 6 non-pawn pieces total (excluding kings). */
export function phaseFor(chess: Chess, ply: number, openingPly = 20): 'opening' | 'middlegame' | 'endgame' {
  if (ply <= openingPly) return 'opening'
  let pieces = 0, queens = 0
  for (const row of chess.board()) for (const sq of row) if (sq && sq.type !== 'p' && sq.type !== 'k') { pieces++; if (sq.type === 'q') queens++ }
  if (queens === 0 || pieces <= 6) return 'endgame'
  return 'middlegame'
}

/** A missed move is "tactical" if it is forcing: capture, check, promotion — or the punishment by the opponent was. */
export function categoryFor(phase: ReturnType<typeof phaseFor>, chess: Chess, bestUci: string): ErrorCategory {
  if (phase === 'opening') return 'opening'
  if (phase === 'endgame') return 'endgame'
  const forcing = (fen: string, uci: string) => {
    try { const c = new Chess(fen); const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); return !!(m.captured || m.promotion || c.inCheck()) } catch { return false }
  }
  return forcing(chess.fen(), bestUci) ? 'tactic' : 'plan'
}

export interface AnalysisProgress { ply: number; total: number }

/** Analyse a game with the local engine. Resolves evals (White's perspective, after each ply) and the user's errors. */
export async function analyseGame(game: StoredGame, engine: Engine, opts: { depth?: number; movetimeMs?: number; onProgress?: (p: AnalysisProgress) => void; signal?: AbortSignal } = {}): Promise<Pick<StoredGame, 'evals' | 'errors' | 'summary'>> {
  const sans = game.moves.split(' ').filter(Boolean)
  const chess = new Chess()
  const depth = opts.depth ?? 12, movetimeMs = opts.movetimeMs ?? 350
  await engine.setSkill(20); await engine.setElo(null); engine.newGame()

  // eval of a position from the side to move, with its best move
  const evalPos = async (fen: string): Promise<{ cp: number; mate?: number; best: string }> => {
    let last: { cp?: number; mate?: number } = {}
    const { bestmove } = await engine.go(fen, { depth, movetimeMs, onInfo: (i) => { last = { cp: i.cp, mate: i.mate } } })
    return { cp: cpFromScore(last.cp, last.mate), mate: last.mate, best: bestmove }
  }

  const evals: MoveEval[] = []
  const errors: GameError[] = []
  let prev = await evalPos(chess.fen()) // start position, from White's view
  let prevWhiteCp = prev.cp
  let userLossSum = 0, userMoves = 0
  for (let i = 0; i < sans.length; i++) {
    if (opts.signal?.aborted) throw new Error('aborted')
    const ply = i + 1
    const mover = chess.turn()
    const fenBefore = chess.fen()
    const phase = phaseFor(chess, ply)
    const m = chess.move(sans[i])
    const terminal = chess.isGameOver()
    const cur = terminal ? { cp: chess.isCheckmate() ? (chess.turn() === 'w' ? -MATE_CP : MATE_CP) : 0, mate: undefined, best: '(none)' } : await evalPos(chess.fen())
    // cur is from the side-to-move (opponent of mover) perspective → convert to White's
    const curWhiteCp = terminal ? cur.cp : (chess.turn() === 'w' ? cur.cp : -cur.cp)
    evals.push({ ply, san: m.san, cp: curWhiteCp, mate: cur.mate, best: prev.best })
    if (mover === game.userColor) {
      const sign = mover === 'w' ? 1 : -1
      const before = winPct(sign * prevWhiteCp)
      const after = winPct(sign * curWhiteCp)
      const loss = Math.max(0, before - after)
      userLossSum += Math.max(0, sign * (prevWhiteCp - curWhiteCp)); userMoves++
      const sev = severityFor(loss)
      const playedUci = m.from + m.to + (m.promotion ?? '')
      if (sev && prev.best !== playedUci) {
        const probe = new Chess(fenBefore)
        let bestSan = prev.best
        try { bestSan = probe.move({ from: prev.best.slice(0, 2), to: prev.best.slice(2, 4), promotion: prev.best[4] }).san } catch { /* keep uci */ }
        errors.push({ ply, san: m.san, best: prev.best, bestSan, fenBefore, lossPct: Math.round(loss), severity: sev, category: categoryFor(phase, new Chess(fenBefore), prev.best), evalBefore: sign * prevWhiteCp, evalAfter: sign * curWhiteCp })
      }
    }
    prev = cur; prevWhiteCp = curWhiteCp
    opts.onProgress?.({ ply, total: sans.length })
  }
  const summary = { acpl: userMoves ? Math.round(userLossSum / userMoves) : 0, inaccuracies: errors.filter((e) => e.severity === 'inaccuracy').length, mistakes: errors.filter((e) => e.severity === 'mistake').length, blunders: errors.filter((e) => e.severity === 'blunder').length }
  return { evals, errors, summary }
}
