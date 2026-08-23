import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { TRICKS } from './tricks'
import { uciToMove } from '@/shared/chess/puzzle'

describe('tricks catalogue', () => {
  it('unique ids', () => { expect(new Set(TRICKS.map((t) => t.id)).size).toBe(TRICKS.length) })
  for (const t of TRICKS) {
    it(`${t.name}: line is legal, mates are mates, notes and task plies in range`, () => {
      const c = new Chess()
      const sans = t.line.split(' ')
      sans.forEach((san, i) => {
        expect(() => c.move(san), `${t.id} ply ${i + 1} ${san}`).not.toThrow()
        if (san.endsWith('#')) expect(c.isCheckmate(), `${t.id} ${san} should be mate`).toBe(true)
        if (san.endsWith('+') && !san.endsWith('#')) expect(c.inCheck(), `${t.id} ${san} should be check`).toBe(true)
      })
      for (const k of Object.keys(t.notes)) expect(Number(k)).toBeLessThanOrEqual(sans.length)
      if (t.task) {
        expect(t.task.ply).toBeLessThan(sans.length)
        const p = new Chess(); for (let i = 0; i < t.task.ply; i++) p.move(sans[i])
        // the task's side to move must be the trick's side... unless the task teaches the other side (avoid); allow both but moves must be legal
        for (const u of t.task.solution) expect(() => p.move(uciToMove(u)), `${t.id} task move ${u}`).not.toThrow()
        for (const u of t.task.accept ?? []) { const q = new Chess(); for (let i = 0; i < t.task!.ply; i++) q.move(sans[i]); expect(() => q.move(uciToMove(u)), `${t.id} accept ${u}`).not.toThrow() }
        // first solution move should match the line's next move when the task continues the line
        const next = new Chess(); for (let i = 0; i < t.task.ply; i++) next.move(sans[i])
        const m = next.move(sans[t.task.ply]); const lineUci = m.from + m.to + (m.promotion ?? '')
        const firstMatchesLine = t.task.solution[0] === lineUci || (t.task.accept ?? []).includes(lineUci)
        // tasks that teach the *other* side (avoid) intentionally diverge; flag the expectation explicitly
        const divergent = ['englund', 'vienna', 'traxler'].includes(t.id) ? false : true
        if (divergent) expect(firstMatchesLine, `${t.id}: task solution ${t.task.solution[0]} vs line ${lineUci}`).toBe(true)
      }
    })
  }
})
