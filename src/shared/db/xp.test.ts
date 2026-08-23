import { describe, it, expect } from 'vitest'
import { computeStreak } from './xp'

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(new Set(['2026-08-21', '2026-08-22', '2026-08-23']), '2026-08-23')).toBe(3)
  })
  it('keeps yesterday-ending streak alive when today is not yet active', () => {
    expect(computeStreak(new Set(['2026-08-21', '2026-08-22']), '2026-08-23')).toBe(2)
  })
  it('breaks on a gap', () => {
    expect(computeStreak(new Set(['2026-08-20', '2026-08-22', '2026-08-23']), '2026-08-23')).toBe(2)
    expect(computeStreak(new Set(['2026-08-20']), '2026-08-23')).toBe(0)
  })
})
