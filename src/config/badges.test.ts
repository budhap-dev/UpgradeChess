import { describe, it, expect } from 'vitest'
import { evaluateBadges, BADGES } from './badges'

const base = { attempts: [], streak: 0, level: 1, gamesReviewed: 0, mastered: new Set<string>(), srsStrong: 0, stormBest: 0, woodpeckerCycles: 0, tacticsRating: 1500 }
describe('badges', () => {
  it('has unique ids', () => { expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length) })
  it('nothing earned on a fresh profile', () => { expect(evaluateBadges(base).filter((b) => b.earned)).toHaveLength(0) })
  it('earns counting badges and reports progress', () => {
    const r = evaluateBadges({ ...base, attempts: Array.from({ length: 120 }, (_, k) => ({ solved: k % 10 !== 0, themes: ['fork'], hints: 0 })), streak: 8, gamesReviewed: 1 })
    const by = Object.fromEntries(r.map((b) => [b.def.id, b]))
    expect(by['first-blood'].earned).toBe(true); expect(by['century'].earned).toBe(true); expect(by['thousand'].earned).toBe(false)
    expect(by['thousand'].progress).toBe(108)
    expect(by['streak-7'].earned).toBe(true); expect(by['review-1'].earned).toBe(true)
    expect(by['motif:fork'].earned).toBe(true) // 108/120 = 90%
  })
  it('motif badge needs accuracy, not just volume', () => {
    const r = evaluateBadges({ ...base, attempts: Array.from({ length: 150 }, (_, k) => ({ solved: k % 2 === 0, themes: ['pin'], hints: 0 })) })
    expect(r.find((b) => b.def.id === 'motif:pin')!.earned).toBe(false)
  })
})
