import { describe, it, expect } from 'vitest'
import { mergeDumps, type Dump } from './sync'

const base = (over: Partial<Dump> = {}): Dump => ({ v: 1, exportedAt: 1000, xpEvents: [], puzzleAttempts: [], playerRating: [], externalRatings: [], progress: [], srsCards: [], settings: [], badges: [], games: [], ...over })

describe('mergeDumps', () => {
  it('unions append-only tables by stable keys and drops auto ids', () => {
    const a = base({ xpEvents: [{ id: 1, type: 'puzzle_solved', xp: 10, refId: 'p1', ts: 1, day: 'd' }], puzzleAttempts: [{ id: 7, puzzleId: 'p1', rating: 1500, solved: true, timeMs: 1, hints: 0, themes: [], ts: 1, day: 'd', ratingAfter: 1510 }] })
    const b = base({ xpEvents: [{ id: 1, type: 'puzzle_solved', xp: 10, refId: 'p1', ts: 1, day: 'd' }, { id: 2, type: 'lesson', xp: 40, refId: 'l', ts: 2, day: 'd' }], puzzleAttempts: [{ id: 1, puzzleId: 'p2', rating: 1500, solved: false, timeMs: 1, hints: 0, themes: [], ts: 2, day: 'd', ratingAfter: 1500 }] })
    const m = mergeDumps(a, b)
    expect(m.xpEvents).toHaveLength(2); expect(m.puzzleAttempts).toHaveLength(2); expect(m.xpEvents.every((e) => e.id === undefined)).toBe(true)
  })
  it('keeps the newer rating and the mastered progress', () => {
    const a = base({ playerRating: [{ kind: 'tactics', rating: 1600, rd: 60, vol: 0.06, updatedAt: 5 }], progress: [{ nodeId: 'x', status: 'mastered', score: 100, attempts: 1, lastAt: 1 }] })
    const b = base({ playerRating: [{ kind: 'tactics', rating: 1650, rd: 50, vol: 0.06, updatedAt: 9 }], progress: [{ nodeId: 'x', status: 'in-progress', score: 40, attempts: 3, lastAt: 9 }] })
    const m = mergeDumps(a, b)
    expect(m.playerRating[0].rating).toBe(1650); expect(m.progress[0].status).toBe('mastered')
  })
  it('settings: newer dump wins per key', () => {
    const a = base({ exportedAt: 1, settings: [{ key: 'theme', value: 'dark' }, { key: 'lichessUser', value: 'a' }] })
    const b = base({ exportedAt: 2, settings: [{ key: 'theme', value: 'light' }] })
    const m = mergeDumps(a, b)
    expect(m.settings.find((s) => s.key === 'theme')?.value).toBe('light'); expect(m.settings.find((s) => s.key === 'lichessUser')?.value).toBe('a')
  })
})
