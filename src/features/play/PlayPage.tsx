import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Board } from '@/shared/ui/Board'
import { getEngine, type EvalInfo } from '@/shared/engine/engine'
import { uciToMove } from '@/shared/chess/puzzle'
import { addXp } from '@/shared/db/xp'
import { db } from '@/shared/db/db'
import { XP } from '@/config/scoring'
import { useToast } from '@/shared/ui/toastStore'
import { ENDGAMES } from '@/features/path/endgames'
import { useSettings } from '@/shared/hooks/useSettings'

/**
 * Graded levels = Stockfish "Skill Level" + move time. Stockfish skill levels are not calibrated to any human
 * rating system, so the equivalents below are rough estimates (playing strength varies a lot with the time
 * control and with how the engine's errors happen to fall). Lichess ratings run ~150–250 above Chess.com
 * rapid at club level; FIDE classical is typically a little below Chess.com rapid.
 */
export const LEVELS = [
  { id: 1, label: 'Beginner', skill: 0, ms: 150, est: { lichess: 1000, chesscom: 700, fide: null } },
  { id: 2, label: 'Casual', skill: 3, ms: 250, est: { lichess: 1300, chesscom: 1050, fide: 1000 } },
  { id: 3, label: 'Club', skill: 6, ms: 350, est: { lichess: 1550, chesscom: 1350, fide: 1250 } },
  { id: 4, label: 'Strong club', skill: 9, ms: 500, est: { lichess: 1850, chesscom: 1650, fide: 1550 } },
  { id: 5, label: 'Expert', skill: 13, ms: 700, est: { lichess: 2100, chesscom: 1950, fide: 1850 } },
  { id: 6, label: 'Master', skill: 17, ms: 1000, est: { lichess: 2400, chesscom: 2250, fide: 2150 } },
  { id: 7, label: 'Full strength', skill: 20, ms: 1500, est: { lichess: null, chesscom: null, fide: null } },
] as const
const SYSTEM_LABEL = { lichess: 'Lichess', chesscom: 'Chess.com', fide: 'FIDE' } as const
const fmt = (v: number | null) => (v == null ? '—' : `~${v}`)

export default function PlayPage() {
  const [sp] = useSearchParams()
  const endgameId = sp.get('endgame')
  const endgame = ENDGAMES.find((e) => e.id === endgameId)
  const [settings, updateSettings] = useSettings()
  const [level, setLevel] = useState(3)
  const [color, setColor] = useState<'white' | 'black'>(endgame?.side === 'b' ? 'black' : 'white')
  const chessRef = useRef(new Chess(endgame?.fen))
  const [fen, setFen] = useState(chessRef.current.fen())
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [thinking, setThinking] = useState(false)
  const [evalInfo, setEvalInfo] = useState<EvalInfo | null>(null)
  const [showEval, setShowEval] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [engineErr, setEngineErr] = useState<string | null>(null)
  const show = useToast((t) => t.show)
  const sanList = useMemo(() => chessRef.current.history(), [fen])
  const lvl = LEVELS.find((l) => l.id === level)!

  const checkEnd = useCallback(async (c: Chess) => {
    if (!c.isGameOver()) return false
    let msg = 'Draw'
    if (c.isCheckmate()) msg = c.turn() === color[0] ? 'You were checkmated' : 'Checkmate — you win!'
    else if (c.isStalemate()) msg = 'Stalemate'
    else if (c.isInsufficientMaterial()) msg = 'Draw by insufficient material'
    else if (c.isThreefoldRepetition()) msg = 'Draw by repetition'
    setResult(msg)
    if (endgame) {
      const won = endgame.goal === 'win' ? c.isCheckmate() && c.turn() !== color[0] : c.isDraw()
      if (won) {
        const prev = await db.progress.get(endgame.nodeId)
        const xp = prev?.status === 'mastered' ? XP.endgameConvertedRepeat : XP.endgameConvertedFirst
        await db.progress.put({ nodeId: endgame.nodeId, status: 'mastered', score: 100, attempts: (prev?.attempts ?? 0) + 1, lastAt: Date.now() })
        await addXp('endgame', xp, endgame.id)
        show(`${endgame.title} converted +${xp} XP`)
      }
    }
    return true
  }, [color, endgame, show])

  const engineMove = useCallback(async () => {
    const c = chessRef.current
    if (c.isGameOver()) return
    setThinking(true)
    try {
      const eng = getEngine()
      await eng.setSkill(lvl.skill)
      const { bestmove } = await eng.go(c.fen(), { movetimeMs: lvl.ms, onInfo: (i) => setEvalInfo(i) })
      if (bestmove && bestmove !== '(none)') {
        const m = c.move(uciToMove(bestmove))
        setFen(c.fen()); setLastMove({ from: m.from, to: m.to })
        await checkEnd(c)
      }
    } catch (e) { setEngineErr((e as Error).message) }
    setThinking(false)
  }, [lvl, checkEnd])

  const reset = useCallback((side: 'white' | 'black' = color) => {
    const c = new Chess(endgame?.fen)
    chessRef.current = c
    setFen(c.fen()); setLastMove(null); setResult(null); setEvalInfo(null)
    getEngine().newGame()
    if (c.turn() !== side[0]) void engineMove()
  }, [color, endgame, engineMove])

  useEffect(() => { if (color === 'black' && chessRef.current.history().length === 0 && chessRef.current.turn() === 'w') void engineMove() }, [color, engineMove])
  useEffect(() => () => getEngine().stop(), [])

  const onMove = (from: string, to: string, promotion?: string) => {
    const c = chessRef.current
    if (c.turn() !== color[0] || thinking || result) return false
    try { const m = c.move({ from, to, promotion }); setFen(c.fen()); setLastMove({ from: m.from, to: m.to }) } catch { return false }
    void checkEnd(c).then((over) => { if (!over) void engineMove() })
    return true
  }

  const undo = () => {
    const c = chessRef.current
    if (thinking) return
    c.undo(); if (c.turn() !== color[0]) c.undo()
    setFen(c.fen()); setLastMove(null); setResult(null)
  }

  const evalText = evalInfo ? (evalInfo.mate != null ? `M${Math.abs(evalInfo.mate)}` : `${(((chessRef.current.turn() === 'w' ? 1 : -1) * (evalInfo.cp ?? 0)) / 100).toFixed(1)}`) : '—'

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow">{endgame ? 'Endgame trainer' : 'Play'}</div><h1>{endgame ? endgame.title : 'Play vs engine'}</h1></div>
        {thinking && <span className="pill">Engine thinking…</span>}
      </div>
      {endgame && <p className="muted">{endgame.goal === 'win' ? 'Win this position.' : 'Hold the draw.'} {endgame.hint}</p>}
      <div className="two-col">
        <div className="board-wrap"><Board fen={fen} orientation={color} interactive={!thinking && !result} onMove={onMove} lastMove={lastMove} id="play" /></div>
        <div className="stack">
          <div className="card stack">
            {result ? <h3>{result}</h3> : <h3>{chessRef.current.turn() === color[0] ? 'Your move' : 'Engine to move'}</h3>}
            {engineErr && <p style={{ color: 'var(--bad)' }}>Engine failed to load: {engineErr}</p>}
            <label>Level
              <select className="input" value={level} onChange={(e) => setLevel(Number(e.target.value))}>{LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label} · {l.id === 7 ? '3000+' : fmt(l.est[settings.ratingSystem])}</option>)}</select>
            </label>
            <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
              <span className="muted">Ratings shown as</span>
              <span className="row" style={{ gap: 4 }}>
                {(['lichess', 'chesscom', 'fide'] as const).map((sys) => <button key={sys} className={`btn sm ${settings.ratingSystem === sys ? 'primary' : 'ghost'}`} onClick={() => updateSettings({ ratingSystem: sys })}>{SYSTEM_LABEL[sys]}</button>)}
              </span>
            </div>
            <p className="muted" style={{ fontSize: 12 }}>Estimates — engine skill levels aren't calibrated to human ratings, and strength varies with the time control.</p>
            {!endgame && <label>Play as
              <select className="input" value={color} onChange={(e) => { const s = e.target.value as 'white' | 'black'; setColor(s); reset(s) }}><option value="white">White</option><option value="black">Black</option></select>
            </label>}
            <div className="row">
              <button className="btn primary" onClick={() => reset()}>New game</button>
              <button className="btn" onClick={undo} disabled={sanList.length === 0}>Undo</button>
              <button className="btn ghost" onClick={() => setShowEval((v) => !v)}>{showEval ? 'Hide eval' : 'Show eval'}</button>
            </div>
            {showEval && <p className="mono muted">Eval {evalText} · depth {evalInfo?.depth ?? 0}</p>}
          </div>
          <div className="card flat">
            <div className="eyebrow">Moves</div>
            <p className="mono" style={{ fontSize: 14, lineHeight: 1.7, marginTop: 6 }}>
              {sanList.length === 0 ? <span className="muted">—</span> : sanList.map((m, i) => <span key={i}>{i % 2 === 0 && <span className="muted">{i / 2 + 1}. </span>}{m} </span>)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
