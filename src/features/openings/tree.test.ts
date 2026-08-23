import { describe, it, expect } from 'vitest'
import { buildTree, randomLine } from './tree'
import { REPERTOIRES } from '@/features/path/repertoires'

describe('repertoire tree', () => {
  it('merges lines and creates one card per learner position', () => {
    const t = buildTree(REPERTOIRES[0])
    expect(t.root.children.length).toBe(1) // all Italian lines start 1.e4
    expect(t.cards.length).toBeGreaterThan(10)
    expect(new Set(t.cards.map((c) => c.id)).size).toBe(t.cards.length)
  })
  it('random line reaches a leaf', () => {
    const t = buildTree(REPERTOIRES[2])
    const line = randomLine(t.root, () => 0)
    expect(line[line.length - 1].children.length).toBe(0)
    expect(line[0].san).toBe('e4')
  })
})
