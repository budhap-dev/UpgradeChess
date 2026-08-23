import { describe, it, expect } from 'vitest'
import { puzzleXp, XP } from './scoring'
import { levelForXp, LEVEL_THRESHOLDS } from './levels'

describe('scoring', () => {
  it('gives base XP for an equal-rated solve', () => {
    expect(puzzleXp({ solved: true, puzzleRating: 1500, playerRating: 1500, hints: 0 })).toBe(XP.puzzleSolved)
  })
  it('adds a difficulty bonus capped at the max', () => {
    expect(puzzleXp({ solved: true, puzzleRating: 2500, playerRating: 1500, hints: 0 })).toBe(XP.puzzleSolved + XP.puzzleDifficultyBonusMax)
  })
  it('halves XP with hints and gives consolation XP on failure', () => {
    expect(puzzleXp({ solved: true, puzzleRating: 1500, playerRating: 1500, hints: 1 })).toBe(5)
    expect(puzzleXp({ solved: false, puzzleRating: 1500, playerRating: 1500, hints: 0 })).toBe(XP.puzzleFailed)
  })
  it('levels follow thresholds', () => {
    expect(levelForXp(0).level).toBe(1)
    expect(levelForXp(200).level).toBe(2)
    expect(levelForXp(LEVEL_THRESHOLDS[2] - 1).level).toBe(2)
    expect(levelForXp(LEVEL_THRESHOLDS[2]).level).toBe(3)
    expect(levelForXp(LEVEL_THRESHOLDS[2]).progress).toBe(0)
  })
})
