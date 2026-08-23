import { describe, it, expect } from 'vitest'
import { scheduleSm2, NEW_CARD } from './sm2'

describe('sm2', () => {
  it('grows interval on successive passes', () => {
    const t = 1_000_000
    const a = scheduleSm2(NEW_CARD, 5, t)
    const b = scheduleSm2(a, 5, t)
    const c = scheduleSm2(b, 5, t)
    expect(a.interval).toBe(1); expect(b.interval).toBe(3); expect(c.interval).toBeGreaterThan(3)
    expect(c.due).toBeGreaterThan(b.due)
  })
  it('resets on failure and schedules soon', () => {
    const t = 1_000_000
    const c = scheduleSm2({ ease: 2.5, interval: 10, reps: 3, due: 0 }, 1, t)
    expect(c.reps).toBe(0); expect(c.interval).toBe(0); expect(c.due - t).toBeLessThan(3_600_000)
    expect(c.ease).toBeLessThan(2.5)
  })
})
