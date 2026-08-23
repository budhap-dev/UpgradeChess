import { z } from 'zod'
const BASE = 'https://api.chess.com/pub'

const Mode = z.object({ last: z.object({ rating: z.number(), date: z.number().optional(), rd: z.number().optional() }).optional(), best: z.object({ rating: z.number() }).partial().optional(), record: z.object({ win: z.number(), loss: z.number(), draw: z.number() }).partial().optional() })
export const ChesscomStats = z.object({
  chess_rapid: Mode.optional(), chess_blitz: Mode.optional(), chess_bullet: Mode.optional(), chess_daily: Mode.optional(),
  tactics: z.object({ highest: z.object({ rating: z.number() }).optional() }).optional(),
  puzzle_rush: z.object({ best: z.object({ score: z.number() }).optional() }).optional(),
}).passthrough()
export type ChesscomStats = z.infer<typeof ChesscomStats>

export interface ChesscomPerf { perf: string; rating: number; rd?: number; games?: number; best?: number }

export async function fetchChesscomStats(username: string, signal?: AbortSignal): Promise<ChesscomPerf[] | null> {
  const r = await fetch(`${BASE}/player/${encodeURIComponent(username.toLowerCase())}/stats`, { signal })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`Chess.com responded ${r.status}`)
  const d = ChesscomStats.parse(await r.json())
  const out: ChesscomPerf[] = []
  for (const key of ['chess_rapid', 'chess_blitz', 'chess_bullet', 'chess_daily'] as const) {
    const m = d[key]
    if (m?.last?.rating) {
      const rec = m.record
      const games = rec ? (rec.win ?? 0) + (rec.loss ?? 0) + (rec.draw ?? 0) : undefined
      out.push({ perf: key.replace('chess_', ''), rating: m.last.rating, rd: m.last.rd, games, best: m.best?.rating })
    }
  }
  if (d.tactics?.highest?.rating) out.push({ perf: 'puzzles (best)', rating: d.tactics.highest.rating })
  return out
}
