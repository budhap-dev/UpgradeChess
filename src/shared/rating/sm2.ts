/** SM-2 spaced repetition (Anki-style simplification). quality: 0-5, >=3 is a pass. */
export interface SrsState { ease: number; interval: number; reps: number; due: number }
export const NEW_CARD: SrsState = { ease: 2.5, interval: 0, reps: 0, due: 0 }
const DAY = 86_400_000

export function scheduleSm2(card: SrsState, quality: 0 | 1 | 2 | 3 | 4 | 5, now = Date.now()): SrsState {
  let { ease, interval, reps } = card
  if (quality < 3) { reps = 0; interval = 0 }
  else {
    if (reps === 0) interval = 1
    else if (reps === 1) interval = 3
    else interval = Math.round(interval * ease)
    reps += 1
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  const due = quality < 3 ? now + 10 * 60_000 : now + interval * DAY
  return { ease: Math.round(ease * 100) / 100, interval, reps, due }
}
