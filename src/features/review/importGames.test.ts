import { describe, it, expect } from 'vitest'
import { sanMovesFromPgn, fromLichessGame, fromPgn } from './importGames'

const PGN = `[Event "Live Chess"]
[White "Hikaru"]
[Black "someone"]
[Result "1-0"]
[ECOUrl "https://www.chess.com/openings/Italian-Game"]

1. e4 {[%clk 0:02:59.9]} 1... e5 {[%clk 0:02:58]} 2. Nf3 Nc6 3. Bc4 $1 (3. Bb5 a6) 3... Bc5 1-0`

describe('import', () => {
  it('extracts SAN from annotated PGN', () => {
    const { moves, headers } = sanMovesFromPgn(PGN)
    expect(moves).toBe('e4 e5 Nf3 Nc6 Bc4 Bc5')
    expect(headers.Result).toBe('1-0')
  })
  it('maps a lichess game to the user colour', () => {
    const g = fromLichessGame({ id: 'abc', createdAt: 1, players: { white: { user: { name: 'BudhaP' }, rating: 1800 }, black: { user: { name: 'x' } } }, winner: 'black', moves: 'e4 e5', speed: 'rapid' }, 'budhap')
    expect(g?.userColor).toBe('w'); expect(g?.result).toBe('0-1'); expect(g?.id).toBe('lichess:abc')
  })
  it('imports pasted PGN', () => {
    const g = fromPgn(PGN, 'b')
    expect(g?.moves.split(' ').length).toBe(6); expect(g?.white).toBe('Hikaru')
  })
})
