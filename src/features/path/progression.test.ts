import { describe, it, expect } from 'vitest'
import { nodeStates, nextRecommended } from './progression'
import type { PathNode } from './types'
import type { PuzzleAttempt } from '@/shared/db/db'

const nodes: PathNode[] = [
  { id: 'a', track: 'tactics', band: 'foundation', kind: 'lesson', title: 'A', blurb: '', xp: 40 },
  { id: 'b', track: 'tactics', band: 'foundation', kind: 'themed-set', title: 'B', blurb: '', xp: 60, requires: ['a'], theme: 'fork', target: { count: 3, accuracy: 66 } },
  { id: 'c', track: 'endgames', band: 'foundation', kind: 'endgame', title: 'C', blurb: '', xp: 50, endgameId: 'x' },
]
const att = (solved: boolean): PuzzleAttempt => ({ puzzleId: 'p', rating: 1500, solved, timeMs: 1, hints: 0, themes: ['fork'], ts: 1, day: 'd', ratingAfter: 1500 })

describe('progression', () => {
  it('locks nodes with unmet prerequisites', () => {
    const s = nodeStates(nodes, [], [])
    expect(s.a.state).toBe('available'); expect(s.b.state).toBe('locked'); expect(s.c.state).toBe('available')
  })
  it('unlocks and derives themed-set mastery from attempts', () => {
    const prog = [{ nodeId: 'a', status: 'mastered' as const, score: 100, attempts: 1, lastAt: 1 }]
    expect(nodeStates(nodes, prog, [att(true)]).b.state).toBe('in-progress')
    expect(nodeStates(nodes, prog, [att(true), att(true), att(false)]).b.state).toBe('mastered')
    expect(nodeStates(nodes, prog, [att(true), att(false), att(false)]).b.state).toBe('in-progress')
  })
  it('recommends one node per track plus due cards', () => {
    const recs = nextRecommended({ progress: [], attempts: [], dueCards: 3, nodes })
    expect(recs[0].id).toBe('srs')
    expect(recs.map((r) => r.id)).toEqual(['srs', 'a', 'c'])
  })
})
