import { db } from '@/shared/db/db'
import { fetchNextPuzzle } from '@/shared/api/lichess'
import { fromLichess, type Puzzle } from '@/shared/chess/puzzle'

let packPromise: Promise<Puzzle[]> | null = null
export function loadPack(): Promise<Puzzle[]> {
  packPromise ??= fetch('/data/puzzles.json').then((r) => (r.ok ? (r.json() as Promise<Puzzle[]>) : [])).catch(() => [])
  return packPromise
}

export interface PickOpts { theme?: string; targetRating: number; spread?: number; exclude?: Set<string> }

/** Pick a puzzle near the target rating from the offline pack; fall back to Lichess online. */
export async function nextPuzzle(opts: PickOpts): Promise<Puzzle | null> {
  const pack = await loadPack()
  const attempted = opts.exclude ?? new Set((await db.puzzleAttempts.toArray()).map((a) => a.puzzleId))
  const theme = opts.theme && opts.theme !== 'mix' ? opts.theme : undefined
  let spread = opts.spread ?? 150
  while (spread <= 900) {
    const lo = opts.targetRating - spread, hi = opts.targetRating + spread
    const cands = pack.filter((p) => !attempted.has(p.id) && p.rating >= lo && p.rating <= hi && (!theme || p.themes.includes(theme)))
    if (cands.length) return cands[Math.floor(Math.random() * cands.length)]
    spread *= 2
  }
  if (navigator.onLine) {
    try {
      const diff = opts.targetRating < 1200 ? 'easier' : opts.targetRating > 1900 ? 'harder' : 'normal'
      const p = fromLichess(await fetchNextPuzzle(theme ?? 'mix', diff))
      if (!attempted.has(p.id)) return p
    } catch { /* offline or rate-limited */ }
  }
  // last resort: allow repeats
  const any = pack.filter((p) => !theme || p.themes.includes(theme))
  return any.length ? any[Math.floor(Math.random() * any.length)] : null
}
