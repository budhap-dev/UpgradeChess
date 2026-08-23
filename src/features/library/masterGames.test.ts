import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { MASTER_GAMES } from './masterGames'

describe('master games', () => {
  it('unique ids', () => { expect(new Set(MASTER_GAMES.map((g) => g.id)).size).toBe(MASTER_GAMES.length) })
  for (const g of MASTER_GAMES) {
    it(`${g.title}: legal, mates are mates, notes/guess plies valid and on the right side`, () => {
      const c = new Chess(); const sans = g.moves.split(' ')
      sans.forEach((san, i) => {
        expect(() => c.move(san), `${g.id} ply ${i + 1} ${san}`).not.toThrow()
        if (san.endsWith('#')) expect(c.isCheckmate(), `${g.id} ${san}`).toBe(true)
      })
      if (g.moves.endsWith('#')) expect(c.isCheckmate()).toBe(true)
      for (const k of Object.keys(g.notes)) expect(Number(k)).toBeLessThanOrEqual(sans.length)
      for (const p of g.guess) { expect(p).toBeLessThanOrEqual(sans.length); expect(p % 2 === 1 ? 'w' : 'b').toBe(g.guessSide) }
    })
  }
})
