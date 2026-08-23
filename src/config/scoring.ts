/** All XP rules live here so they can be tuned without touching feature code. */
export const XP = {
  puzzleSolved: 10,
  puzzleDifficultyBonusMax: 15, // scaled by (puzzleRating - playerRating)
  puzzleFailed: 2,
  puzzleHintPenalty: 0.5, // multiplier
  themedSetCompleted: 60,
  lessonCompleted: 40,
  drillMastered: 80,
  openingCardReviewed: 5,
  openingCardDailyCap: 100,
  endgameConvertedFirst: 50,
  endgameConvertedRepeat: 15,
  gameReviewed: 70,
  dailyGoalHit: 30,
  streakMilestones: { 7: 100, 30: 500, 100: 2000 } as Record<number, number>,
} as const

export const DAILY_GOAL = { puzzles: 15, lessonsOrDrills: 1 } as const

export type XpEventType =
  | 'puzzle_solved' | 'puzzle_failed' | 'themed_set' | 'lesson' | 'drill' | 'opening_card'
  | 'endgame' | 'game_review' | 'daily_goal' | 'streak'

/** XP for a rated puzzle attempt. Difficulty bonus grows when the puzzle is above the player's rating. */
export function puzzleXp(opts: { solved: boolean; puzzleRating: number; playerRating: number; hints: number }): number {
  if (!opts.solved) return XP.puzzleFailed
  const diff = Math.max(0, Math.min(400, opts.puzzleRating - opts.playerRating))
  const bonus = Math.round((diff / 400) * XP.puzzleDifficultyBonusMax)
  const base = XP.puzzleSolved + bonus
  return opts.hints > 0 ? Math.round(base * XP.puzzleHintPenalty) : base
}
