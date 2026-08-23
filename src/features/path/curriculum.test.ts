import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { CURRICULUM } from './curriculum'
import { ENDGAMES } from './endgames'
import { REPERTOIRES } from './repertoires'
import { uciToMove } from '@/shared/chess/puzzle'

describe('curriculum integrity', () => {
  it('has unique ids and valid prerequisites', () => {
    const ids = new Set(CURRICULUM.map((n) => n.id))
    expect(ids.size).toBe(CURRICULUM.length)
    for (const n of CURRICULUM) for (const r of n.requires ?? []) expect(ids.has(r), `${n.id} requires ${r}`).toBe(true)
  })
  it('every lesson FEN is valid and every task solution is legal', () => {
    for (const n of CURRICULUM) for (const [i, s] of (n.steps ?? []).entries()) {
      if (s.fen) expect(() => new Chess(s.fen), `${n.id} step ${i}`).not.toThrow()
      if (s.task) {
        const c = new Chess(s.task.fen)
        for (const u of s.task.solution) expect(() => c.move(uciToMove(u)), `${n.id} step ${i} move ${u}`).not.toThrow()
        for (const u of s.task.accept ?? []) expect(() => new Chess(s.task!.fen).move(uciToMove(u)), `${n.id} accept ${u}`).not.toThrow()
      }
    }
  })
  it('endgame nodes point at real positions and vice versa', () => {
    for (const n of CURRICULUM.filter((n) => n.kind === 'endgame')) expect(ENDGAMES.find((e) => e.id === n.endgameId && e.nodeId === n.id), n.id).toBeTruthy()
    for (const e of ENDGAMES) expect(() => new Chess(e.fen)).not.toThrow()
  })
  it('opening nodes point at repertoires and every line is legal', () => {
    for (const n of CURRICULUM.filter((n) => n.kind === 'opening')) expect(REPERTOIRES.find((r) => r.id === n.repertoireId), n.id).toBeTruthy()
    for (const r of REPERTOIRES) for (const line of r.lines) {
      const c = new Chess()
      for (const san of line.split(' ')) expect(() => c.move(san), `${r.id}: ${line} at ${san}`).not.toThrow()
    }
  })
})
