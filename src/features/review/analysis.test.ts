import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { winPct, severityFor, phaseFor, categoryFor } from './analysis'

describe('analysis helpers', () => {
  it('win% is symmetric and monotone', () => {
    expect(winPct(0)).toBeCloseTo(50, 5)
    expect(winPct(300) + winPct(-300)).toBeCloseTo(100, 5)
    expect(winPct(100)).toBeGreaterThan(winPct(50))
    expect(winPct(5000)).toBeLessThanOrEqual(100)
  })
  it('severity thresholds', () => {
    expect(severityFor(5)).toBeNull(); expect(severityFor(12)).toBe('inaccuracy'); expect(severityFor(25)).toBe('mistake'); expect(severityFor(40)).toBe('blunder')
  })
  it('phase detection', () => {
    expect(phaseFor(new Chess(), 5)).toBe('opening')
    const mid = new Chess('r1bq1rk1/pp2bppp/2n1pn2/3p4/2PP4/2N2N2/PP2BPPP/R2QKB1R w KQ - 0 9')
    expect(phaseFor(mid, 30)).toBe('middlegame')
    expect(phaseFor(new Chess('8/8/8/4k3/8/8/4P3/4K3 w - - 0 1'), 60)).toBe('endgame')
    expect(phaseFor(new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 60)).toBe('endgame') // no queens
  })
  it('categorises forcing misses as tactics, quiet ones as plans', () => {
    const c = new Chess('rnb1kbnr/pppp1ppp/8/4p1q1/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3')
    expect(categoryFor('middlegame', c, 'f3g5')).toBe('tactic')     // Nxg5 captures
    expect(categoryFor('middlegame', c, 'b1c3')).toBe('plan')       // quiet
    expect(categoryFor('opening', c, 'f3g5')).toBe('opening')
    expect(categoryFor('endgame', c, 'f3g5')).toBe('endgame')
  })
})
