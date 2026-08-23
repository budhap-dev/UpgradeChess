import { describe, it, expect } from 'vitest'
import { updateGlicko, expectedScore, DEFAULT_GLICKO, PUZZLE_RD } from './glicko2'

describe('glicko2', () => {
  it('raises rating and lowers RD after a win', () => {
    const next = updateGlicko(DEFAULT_GLICKO, { rating: 1500, rd: PUZZLE_RD, vol: 0.06 }, 1)
    expect(next.rating).toBeGreaterThan(1500)
    expect(next.rd).toBeLessThan(DEFAULT_GLICKO.rd)
  })
  it('lowers rating after a loss', () => {
    const next = updateGlicko(DEFAULT_GLICKO, { rating: 1500, rd: PUZZLE_RD, vol: 0.06 }, 0)
    expect(next.rating).toBeLessThan(1500)
  })
  it('moves less for an established player', () => {
    const established = { rating: 1800, rd: 50, vol: 0.06 }
    const a = updateGlicko(established, { rating: 1800, rd: PUZZLE_RD, vol: 0.06 }, 1)
    const b = updateGlicko(DEFAULT_GLICKO, { rating: 1500, rd: PUZZLE_RD, vol: 0.06 }, 1)
    expect(a.rating - 1800).toBeLessThan(b.rating - 1500)
  })
  it('matches the Glickman paper example within tolerance', () => {
    // Player 1500/200 beats 1400/30, loses to 1550/100, loses to 1700/300 → ~1464.06 / 151.52 (sequential approx differs slightly)
    let p = { rating: 1500, rd: 200, vol: 0.06 }
    p = updateGlicko(p, { rating: 1400, rd: 30, vol: 0.06 }, 1)
    p = updateGlicko(p, { rating: 1550, rd: 100, vol: 0.06 }, 0)
    p = updateGlicko(p, { rating: 1700, rd: 300, vol: 0.06 }, 0)
    expect(p.rating).toBeGreaterThan(1420)
    expect(p.rating).toBeLessThan(1500)
  })
  it('expected score is 0.5 at equal rating', () => {
    expect(expectedScore({ rating: 1600, rd: 50, vol: 0.06 }, 1600)).toBeCloseTo(0.5, 2)
  })
})
