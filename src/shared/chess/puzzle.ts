import { Chess } from 'chess.js'
import type { LichessPuzzle } from '@/shared/api/lichess'

/** App-level puzzle: a position where the opponent has just played, and the solver must find `solution` (UCI). */
export interface Puzzle {
  id: string
  fen: string            // position BEFORE the opponent's last move (we animate it)
  opponentMove: string   // UCI — played automatically, then the solver moves
  solution: string[]     // UCI moves the solver must play, alternating with opponent replies
  rating: number
  themes: string[]
  sideToMove: 'w' | 'b'  // solver's colour
  gameId?: string
}

/** Convert a Lichess API puzzle (PGN + initialPly) into a FEN-based puzzle. */
export function fromLichess(p: LichessPuzzle): Puzzle {
  const chess = new Chess()
  const moves = p.game.pgn.trim().split(/\s+/)
  // initialPly = number of plies played before the opponent's "setup" move. Lichess puzzles: position after initialPly+1 plies is the solver's turn.
  for (let i = 0; i < p.puzzle.initialPly && i < moves.length; i++) chess.move(moves[i])
  const fenBefore = chess.fen()
  const setupSan = moves[p.puzzle.initialPly]
  const mv = chess.move(setupSan)
  if (!mv) throw new Error('Invalid setup move in puzzle ' + p.puzzle.id)
  return {
    id: p.puzzle.id,
    fen: fenBefore,
    opponentMove: mv.from + mv.to + (mv.promotion ?? ''),
    solution: p.puzzle.solution,
    rating: p.puzzle.rating,
    themes: p.puzzle.themes,
    sideToMove: chess.turn(),
    gameId: p.game.id,
  }
}

export const uciToMove = (uci: string) => ({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined })

/** True if `uci` is an acceptable solution move at this step (Lichess accepts any mate as correct). */
export function isCorrectMove(chess: Chess, uci: string, expected: string): boolean {
  if (uci === expected) return true
  const probe = new Chess(chess.fen())
  try {
    probe.move(uciToMove(uci))
    return probe.isCheckmate()
  } catch { return false }
}
