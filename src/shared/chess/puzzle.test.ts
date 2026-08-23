import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { fromLichess, isCorrectMove, uciToMove } from './puzzle'

const sample = {
  game: { id: 'ljUqeMqe', pgn: 'd4 c5 e4 cxd4 Qxd4 Nc6 Qd1 g6 Nc3 Bg7 Bd3 a6 Bd2 d6 Nf3 Bg4 h3 Bd7 O-O Nf6 Ne2 Qc8 Bc3 Bxh3 gxh3 Qxh3 Ng3 h5 Re1 h4 Bf1 Qd7 Ne2' },
  puzzle: { id: 'Sepst', rating: 1536, solution: ['d7g4', 'f1g2', 'h4h3', 'e2g3', 'h3g2'], themes: ['fork'], initialPly: 32 },
}

describe('fromLichess', () => {
  it('derives the position and the setup move', () => {
    const p = fromLichess(sample)
    expect(p.opponentMove).toBe('g3e2')
    expect(p.sideToMove).toBe('b')
    const c = new Chess(p.fen)
    c.move(uciToMove(p.opponentMove))
    expect(() => c.move(uciToMove(p.solution[0]))).not.toThrow()
  })
  it('accepts alternative checkmates', () => {
    const c = new Chess('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1')
    expect(isCorrectMove(c, 'a1a8', 'a1a8')).toBe(true)
    expect(isCorrectMove(c, 'a1a7', 'a1a8')).toBe(false)
  })
})
