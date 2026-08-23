import { useMemo, useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

export interface BoardProps {
  fen: string
  orientation?: 'white' | 'black'
  interactive?: boolean
  /** Return true to accept the move. Called with UCI-like parts. */
  onMove?: (from: string, to: string, promotion?: string) => boolean
  lastMove?: { from: string; to: string } | null
  highlights?: Record<string, CSSProperties>
  animationMs?: number
  id?: string
}

const LAST: CSSProperties = { background: 'color-mix(in srgb, var(--warn) 45%, transparent)' }
const SEL: CSSProperties = { background: 'color-mix(in srgb, var(--accent) 55%, transparent)' }
const DOT: CSSProperties = { background: 'radial-gradient(circle, color-mix(in srgb, var(--ink) 28%, transparent) 22%, transparent 24%)' }
const CAP: CSSProperties = { background: 'radial-gradient(circle, transparent 60%, color-mix(in srgb, var(--ink) 28%, transparent) 62%)' }

/** Chessboard with drag + tap-to-move, legal-move dots, last-move highlight. Auto-queens promotions. */
export function Board({ fen, orientation = 'white', interactive = true, onMove, lastMove, highlights, animationMs = 200, id = 'board' }: BoardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const chess = useMemo(() => { try { return new Chess(fen) } catch { return null } }, [fen])

  const legalTargets = useMemo(() => {
    if (!selected || !chess) return [] as { to: string; capture: boolean }[]
    try { return chess.moves({ square: selected as never, verbose: true }).map((m) => ({ to: m.to, capture: !!m.captured })) } catch { return [] }
  }, [selected, chess])

  const tryMove = (from: string, to: string): boolean => {
    if (!onMove || !chess) return false
    let promotion: string | undefined
    const piece = chess.get(from as never)
    if (piece?.type === 'p' && (to[1] === '8' || to[1] === '1')) promotion = 'q'
    const ok = onMove(from, to, promotion)
    if (ok) setSelected(null)
    return ok
  }

  const squareStyles: Record<string, CSSProperties> = { ...(highlights ?? {}) }
  if (lastMove) { squareStyles[lastMove.from] = { ...LAST, ...squareStyles[lastMove.from] }; squareStyles[lastMove.to] = { ...LAST, ...squareStyles[lastMove.to] } }
  if (selected) squareStyles[selected] = SEL
  for (const t of legalTargets) squareStyles[t.to] = { ...(squareStyles[t.to] ?? {}), ...(t.capture ? CAP : DOT) }

  const turn = chess?.turn()

  return (
    <Chessboard
      options={{
        id,
        position: fen,
        boardOrientation: orientation,
        animationDurationInMs: animationMs,
        allowDragging: interactive,
        squareStyles,
        darkSquareStyle: { backgroundColor: 'var(--board-dark)' },
        lightSquareStyle: { backgroundColor: 'var(--buff)' },
        boardStyle: { borderRadius: 6, overflow: 'hidden', boxShadow: 'var(--shadow)' },
        canDragPiece: ({ piece }) => interactive && !!turn && piece.pieceType[0] === turn,
        onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? tryMove(sourceSquare, targetSquare) : false),
        onSquareClick: ({ square, piece }) => {
          if (!interactive || !chess) return
          if (selected && selected !== square) {
            if (tryMove(selected, square)) return
          }
          if (piece && piece.pieceType[0] === turn) setSelected(square === selected ? null : square)
          else setSelected(null)
        },
      }}
    />
  )
}
