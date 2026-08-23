import { z } from 'zod'

const BASE = 'https://lichess.org'

const Perf = z.object({ rating: z.number(), rd: z.number().optional(), games: z.number().optional(), prog: z.number().optional(), prov: z.boolean().optional() })
export const LichessUser = z.object({
  id: z.string(), username: z.string(),
  perfs: z.record(z.string(), Perf).default({}),
  count: z.object({ all: z.number().optional() }).partial().optional(),
  createdAt: z.number().optional(),
})
export type LichessUser = z.infer<typeof LichessUser>

export async function fetchLichessUser(username: string, signal?: AbortSignal): Promise<LichessUser | null> {
  const r = await fetch(`${BASE}/api/user/${encodeURIComponent(username)}`, { headers: { Accept: 'application/json' }, signal })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Lichess responded ${r.status}`)
  return LichessUser.parse(await r.json())
}

export const LichessPuzzle = z.object({
  game: z.object({ id: z.string(), pgn: z.string(), perf: z.object({ key: z.string(), name: z.string() }).optional(), players: z.array(z.object({ name: z.string(), color: z.string(), rating: z.number().optional() })).optional() }),
  puzzle: z.object({ id: z.string(), rating: z.number(), plays: z.number().optional(), solution: z.array(z.string()), themes: z.array(z.string()), initialPly: z.number() }),
})
export type LichessPuzzle = z.infer<typeof LichessPuzzle>

export async function fetchNextPuzzle(angle = 'mix', difficulty: 'easiest' | 'easier' | 'normal' | 'harder' | 'hardest' = 'normal', signal?: AbortSignal): Promise<LichessPuzzle> {
  const r = await fetch(`${BASE}/api/puzzle/next?angle=${encodeURIComponent(angle)}&difficulty=${difficulty}`, { headers: { Accept: 'application/json' }, signal })
  if (!r.ok) throw new Error(`Lichess responded ${r.status}`)
  return LichessPuzzle.parse(await r.json())
}

export async function fetchPuzzleBatch(angle = 'mix', nb = 20, signal?: AbortSignal): Promise<LichessPuzzle[]> {
  const r = await fetch(`${BASE}/api/puzzle/batch/${encodeURIComponent(angle)}?nb=${nb}`, { headers: { Accept: 'application/json' }, signal })
  if (!r.ok) throw new Error(`Lichess responded ${r.status}`)
  const json = (await r.json()) as { puzzles: unknown[] }
  return z.array(LichessPuzzle).parse(json.puzzles)
}

/** Opening explorer: what players at a rating band play from this position. */
export const ExplorerMove = z.object({ uci: z.string(), san: z.string(), white: z.number(), draws: z.number(), black: z.number(), averageRating: z.number().optional() })
export const Explorer = z.object({ white: z.number(), draws: z.number(), black: z.number(), moves: z.array(ExplorerMove), opening: z.object({ eco: z.string(), name: z.string() }).nullable().optional() })
export type Explorer = z.infer<typeof Explorer>
export async function fetchExplorer(fen: string, ratings = [1600, 1800, 2000], speeds = ['rapid', 'blitz'], signal?: AbortSignal): Promise<Explorer> {
  const u = new URL('https://explorer.lichess.ovh/lichess')
  u.searchParams.set('fen', fen); u.searchParams.set('ratings', ratings.join(',')); u.searchParams.set('speeds', speeds.join(',')); u.searchParams.set('moves', '8'); u.searchParams.set('topGames', '0'); u.searchParams.set('recentGames', '0')
  const r = await fetch(u, { signal })
  if (!r.ok) throw new Error(`Explorer responded ${r.status}`)
  return Explorer.parse(await r.json())
}
