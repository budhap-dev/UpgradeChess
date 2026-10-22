import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useSettings } from '@/shared/hooks/useSettings'
import { BOARD_THEMES, PIECE_CODES, PIECE_SETS, pieceUrl } from '@/config/boardThemes'
import { sfx, setSoundEnabled, setHapticsEnabled } from './sound'

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
  /** Override the user's theme (used by the settings preview). */
  themeId?: string
  pieceSetId?: string
  /** Override the user's coordinates setting (mini boards hide them). */
  coordinates?: boolean
}

const isLight = (sq: string) => (sq.charCodeAt(0) - 97 + Number(sq[1])) % 2 === 0
const LAST = { light: '#EFE3A0', dark: '#C8BE6E' }
const SEL = { light: '#F4D86B', dark: '#D8B84A' }
const DOT = 'radial-gradient(circle, rgba(20,32,25,.3) 0 17%, transparent 18%)'
const CAP = 'radial-gradient(circle, transparent 0 62%, rgba(20,32,25,.3) 63% 74%, transparent 75%)'

const pieceCache = new Map<string, Record<string, () => React.JSX.Element>>()
function piecesFor(setId: string) {
  const set = PIECE_SETS.find((p) => p.id === setId)
  if (!set || set.kind === 'builtin') return undefined
  let obj = pieceCache.get(setId)
  if (!obj) {
    obj = Object.fromEntries(PIECE_CODES.map((code) => [code, () => <img src={pieceUrl(setId, code)} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }} />]))
    pieceCache.set(setId, obj)
  }
  return obj
}

/** Chessboard with drag + tap-to-move, legal-move dots, last-move highlight, themes and sounds. Auto-queens promotions. */
export function Board({ fen, orientation = 'white', interactive = true, onMove, lastMove, highlights, animationMs = 200, id = 'board', themeId, pieceSetId, coordinates }: BoardProps) {
  const [settings] = useSettings()
  const [selected, setSelected] = useState<string | null>(null)
  const chess = useMemo(() => { try { return new Chess(fen) } catch { return null } }, [fen])
  const theme = BOARD_THEMES.find((t) => t.id === (themeId ?? settings.boardTheme)) ?? BOARD_THEMES[0]
  const pieces = useMemo(() => piecesFor(pieceSetId ?? settings.pieceSet), [pieceSetId, settings.pieceSet])
  useEffect(() => { setSoundEnabled(settings.sounds); setHapticsEnabled(settings.haptics) }, [settings.sounds, settings.haptics])

  const legalTargets = useMemo(() => {
    if (!selected || !chess) return [] as { to: string; capture: boolean }[]
    try { return chess.moves({ square: selected as never, verbose: true }).map((m) => ({ to: m.to, capture: !!m.captured })) } catch { return [] }
  }, [selected, chess])

  const tryMove = (from: string, to: string): boolean => {
    if (!onMove || !chess) return false
    let promotion: string | undefined
    const piece = chess.get(from as never)
    if (piece?.type === 'p' && (to[1] === '8' || to[1] === '1')) promotion = 'q'
    const capture = !!chess.get(to as never) || (piece?.type === 'p' && from[0] !== to[0])
    const ok = onMove(from, to, promotion)
    if (ok) { setSelected(null); (capture ? sfx.capture : sfx.move)() }
    return ok
  }

  // tint (last move / selection) sits under any caller highlight; move dots layer on top of both
  const tint: Record<string, string> = {}
  if (lastMove) for (const sq of [lastMove.from, lastMove.to]) tint[sq] = isLight(sq) ? LAST.light : LAST.dark
  if (selected) tint[selected] = isLight(selected) ? SEL.light : SEL.dark
  const squareStyles: Record<string, CSSProperties> = {}
  for (const [sq, bg] of Object.entries(tint)) squareStyles[sq] = { background: bg }
  for (const [sq, st] of Object.entries(highlights ?? {})) squareStyles[sq] = { ...squareStyles[sq], ...st }
  for (const t of legalTargets) {
    const under = squareStyles[t.to]?.background ?? tint[t.to]
    squareStyles[t.to] = { ...squareStyles[t.to], background: under ? `${t.capture ? CAP : DOT}, ${under}` : t.capture ? CAP : DOT }
  }

  const turn = chess?.turn()
  const notationColor = (bg: string) => ({ color: bg })
  const coordStyle: CSSProperties = { fontSize: 'clamp(9px, 1.5vw, 12px)', fontWeight: 700, fontFamily: 'var(--font-body)' }

  return (
    <Chessboard
      options={{
        id,
        position: fen,
        pieces,
        boardOrientation: orientation,
        animationDurationInMs: settings.animations ? animationMs : 0,
        showAnimations: settings.animations,
        showNotation: coordinates ?? settings.showCoordinates,
        allowDragging: interactive,
        squareStyles,
        darkSquareStyle: { backgroundColor: theme.dark },
        lightSquareStyle: { backgroundColor: theme.light },
        darkSquareNotationStyle: notationColor(theme.light),
        lightSquareNotationStyle: notationColor(theme.dark),
        alphaNotationStyle: { ...coordStyle, bottom: 1, right: 3 },
        numericNotationStyle: { ...coordStyle, top: 1, left: 3 },
        boardStyle: { borderRadius: 'var(--board-radius)', overflow: 'hidden', boxShadow: 'var(--board-shadow)', touchAction: 'none' },
        canDragPiece: ({ piece }) => interactive && !!turn && piece.pieceType[0] === turn,
        onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? tryMove(sourceSquare, targetSquare) : false),
        onSquareClick: ({ square, piece }) => {
          if (!interactive || !chess) return
          if (selected && selected !== square) { if (tryMove(selected, square)) return }
          if (piece && piece.pieceType[0] === turn) setSelected(square === selected ? null : square)
          else setSelected(null)
        },
      }}
    />
  )
}
