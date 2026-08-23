import { MOTIFS } from './themes'

export interface BadgeDef { id: string; title: string; desc: string; icon: string; group: 'tactics' | 'motif' | 'consistency' | 'path' | 'review' | 'openings' | 'level' }
export interface BadgeInput {
  attempts: { solved: boolean; themes: string[]; hints: number }[]
  streak: number; level: number; gamesReviewed: number; mastered: Set<string>; srsStrong: number; stormBest: number; woodpeckerCycles: number; tacticsRating: number
}
export interface BadgeState { def: BadgeDef; progress: number; target: number; earned: boolean }

const motifBadges: BadgeDef[] = MOTIFS.map((m) => ({ id: `motif:${m.key}`, title: `${m.label} master`, desc: `Solve 100 ${m.label.toLowerCase()} puzzles at 80 %+`, icon: '♞', group: 'motif' }))

export const BADGES: BadgeDef[] = [
  { id: 'first-blood', title: 'First blood', desc: 'Solve your first rated puzzle', icon: '✓', group: 'tactics' },
  { id: 'century', title: 'Century', desc: 'Solve 100 puzzles', icon: '💯', group: 'tactics' },
  { id: 'thousand', title: 'Thousand', desc: 'Solve 1,000 puzzles', icon: '🏆', group: 'tactics' },
  { id: 'sharp', title: 'Sharp', desc: 'Reach a 1800 tactics rating', icon: '⚔', group: 'tactics' },
  { id: 'storm-20', title: 'Storm chaser', desc: 'Score 20 in Puzzle Storm', icon: '⚡', group: 'tactics' },
  { id: 'storm-40', title: 'Lightning', desc: 'Score 40 in Puzzle Storm', icon: '🌩', group: 'tactics' },
  { id: 'woodpecker-3', title: 'Woodpecker', desc: 'Complete 3 Woodpecker cycles', icon: '🪵', group: 'tactics' },
  ...motifBadges,
  { id: 'streak-7', title: 'One week', desc: '7-day streak', icon: '🔥', group: 'consistency' },
  { id: 'streak-30', title: 'One month', desc: '30-day streak', icon: '🔥', group: 'consistency' },
  { id: 'streak-100', title: 'Iron will', desc: '100-day streak', icon: '🔥', group: 'consistency' },
  { id: 'endgame-basics', title: 'Endgame basics', desc: 'Master K+Q, K+R and K+P conversions', icon: '♖', group: 'path' },
  { id: 'rook-endings', title: 'Rook technician', desc: 'Win the Lucena and hold the Philidor', icon: '♜', group: 'path' },
  { id: 'foundation', title: 'Foundation complete', desc: 'Master every Foundation tactics lesson and drill', icon: '◬', group: 'path' },
  { id: 'review-1', title: 'Honest look', desc: 'Review your first game', icon: '✎', group: 'review' },
  { id: 'review-20', title: 'Iron review', desc: 'Review 20 games', icon: '✎', group: 'review' },
  { id: 'repertoire-50', title: 'Booked up', desc: '50 repertoire positions with 2+ clean recalls', icon: '♙', group: 'openings' },
  { id: 'level-5', title: 'Bishop', desc: 'Reach level 5', icon: '♗', group: 'level' },
  { id: 'level-10', title: 'Queen', desc: 'Reach level 10', icon: '♕', group: 'level' },
]

/** Pure evaluation of every badge from the player's data. */
export function evaluateBadges(i: BadgeInput): BadgeState[] {
  const solved = i.attempts.filter((a) => a.solved).length
  const motif = (key: string) => { const rel = i.attempts.filter((a) => a.themes.includes(key) && a.hints === 0); const ok = rel.filter((a) => a.solved).length; return { n: ok, ok: rel.length >= 100 && ok / rel.length >= 0.8 } }
  const has = (...ids: string[]) => ids.every((id) => i.mastered.has(id))
  const foundationIds = ['t-hanging', 't-hanging-set', 't-fork', 't-fork-set', 't-pin', 't-pin-set', 't-skewer-set', 't-discovered', 't-discovered-set', 't-backrank', 't-backrank-set', 't-mate2-set']
  const st = (def: BadgeDef, progress: number, target: number, earnedOverride?: boolean): BadgeState => ({ def, progress: Math.min(progress, target), target, earned: earnedOverride ?? progress >= target })
  return BADGES.map((def) => {
    switch (def.id) {
      case 'first-blood': return st(def, solved, 1)
      case 'century': return st(def, solved, 100)
      case 'thousand': return st(def, solved, 1000)
      case 'sharp': return st(def, Math.round(i.tacticsRating), 1800)
      case 'storm-20': return st(def, i.stormBest, 20)
      case 'storm-40': return st(def, i.stormBest, 40)
      case 'woodpecker-3': return st(def, i.woodpeckerCycles, 3)
      case 'streak-7': return st(def, i.streak, 7)
      case 'streak-30': return st(def, i.streak, 30)
      case 'streak-100': return st(def, i.streak, 100)
      case 'endgame-basics': return st(def, ['e-kq', 'e-kr', 'e-kp'].filter((x) => i.mastered.has(x)).length, 3)
      case 'rook-endings': return st(def, ['e-lucena', 'e-philidor'].filter((x) => i.mastered.has(x)).length, 2, has('e-lucena', 'e-philidor'))
      case 'foundation': return st(def, foundationIds.filter((x) => i.mastered.has(x)).length, foundationIds.length)
      case 'review-1': return st(def, i.gamesReviewed, 1)
      case 'review-20': return st(def, i.gamesReviewed, 20)
      case 'repertoire-50': return st(def, i.srsStrong, 50)
      case 'level-5': return st(def, i.level, 5)
      case 'level-10': return st(def, i.level, 10)
      default: { const m = motif(def.id.replace('motif:', '')); return st(def, m.n, 100, m.ok) }
    }
  })
}
