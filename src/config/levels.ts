/** Level thresholds grow ~1.35x per level. Level 1 starts at 0 XP. */
export const LEVEL_TITLES = ['Pawn', 'Pawn', 'Knight', 'Knight', 'Bishop', 'Bishop', 'Rook', 'Rook', 'Queen', 'Queen', 'King', 'King', 'Candidate', 'Master', 'Grandmaster']

const thresholds: number[] = [0, 200]
while (thresholds.length < 40) {
  const last = thresholds[thresholds.length - 1]
  const prev = thresholds[thresholds.length - 2]
  thresholds.push(Math.round(last + (last - prev) * 1.35))
}
export const LEVEL_THRESHOLDS = thresholds // index 0 => level 1

export interface LevelInfo { level: number; title: string; current: number; next: number; progress: number }

export function levelForXp(xp: number): LevelInfo {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1
  const current = LEVEL_THRESHOLDS[level - 1]
  const next = LEVEL_THRESHOLDS[level] ?? current
  const progress = next > current ? (xp - current) / (next - current) : 1
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
  return { level, title, current, next, progress }
}
