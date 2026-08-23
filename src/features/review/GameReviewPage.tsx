import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '@/shared/ui/Board'
import { db, type GameError } from '@/shared/db/db'
import { getEngine } from '@/shared/engine/engine'
import { analyseGame, winPct } from './analysis'
import { addXp } from '@/shared/db/xp'
import { XP } from '@/config/scoring'
import { useToast } from '@/shared/ui/toastStore'
import { isCorrectMove } from '@/shared/chess/puzzle'

const CAT_LABEL = { opening: 'Opening', tactic: 'Tactic missed', plan: 'Plan / positional', endgame: 'Endgame technique' } as const
const SEV_MARK = { inaccuracy: '?!', mistake: '?', blunder: '??' } as const
const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const BEST: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--info)' }

export default function GameReviewPage() {
  const { id } = useParams()
  const gid = decodeURIComponent(id ?? '')
  const game = useLiveQuery(() => db.games.get(gid), [gid])
  const show = useToast((t) => t.show)
  const [ply, setPly] = useState(0)
  const [progress, setProgress] = useState<number | null>(null)
  const [quiz, setQuiz] = useState<{ idx: number; state: 'ask' | 'right' | 'wrong'; score: number; tried: number } | null>(null)
  const [mark, setMark] = useState<Record<string, CSSProperties>>({})
  const [quizFen, setQuizFen] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const sans = useMemo(() => (game?.moves ?? '').split(' ').filter(Boolean), [game?.moves])
  const fens = useMemo(() => { const c = new Chess(); const out = [c.fen()]; for (const s of sans) { try { c.move(s); out.push(c.fen()) } catch { break } } return out }, [sans])
  const lastMove = useMemo(() => { if (ply === 0) return null; const c = new Chess(fens[ply - 1]); try { const m = c.move(sans[ply - 1]); return { from: m.from, to: m.to } } catch { return null } }, [ply, fens, sans])
  const errorsByPly = useMemo(() => new Map((game?.errors ?? []).map((e) => [e.ply, e])), [game?.errors])
  const quizErrors = useMemo(() => (game?.errors ?? []).filter((e) => e.severity !== 'inaccuracy'), [game?.errors])

  useEffect(() => () => { abortRef.current?.abort(); getEngine().stop() }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (quiz) return; if (e.key === 'ArrowRight') setPly((p) => Math.min(sans.length, p + 1)); if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, p - 1)) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [sans.length, quiz])

  const analyse = useCallback(async () => {
    if (!game) return
    const ac = new AbortController(); abortRef.current = ac
    setProgress(0)
    try {
      const res = await analyseGame(game, getEngine(), { onProgress: (p) => setProgress(Math.round((p.ply / p.total) * 100)), signal: ac.signal })
      await db.games.update(game.id, { ...res, analysed: true })
      show(`Analysed: ${res.summary!.blunders} blunders, ${res.summary!.mistakes} mistakes`)
    } catch (e) { if ((e as Error).message !== 'aborted') show('Analysis failed: ' + (e as Error).message) }
    setProgress(null)
  }, [game, show])

  const startQuiz = () => { if (!quizErrors.length) return; setQuiz({ idx: 0, state: 'ask', score: 0, tried: 0 }); setQuizFen(quizErrors[0].fenBefore); setPly(quizErrors[0].ply - 1); setMark({}) }
  const nextQuiz = () => {
    if (!quiz) return
    const n = quiz.idx + 1
    if (n >= quizErrors.length) { setQuiz(null); setQuizFen(null); setMark({}); show(`Quiz done: ${quiz.score}/${quizErrors.length} best moves found`); return }
    setQuiz({ ...quiz, idx: n, state: 'ask' }); setQuizFen(quizErrors[n].fenBefore); setPly(quizErrors[n].ply - 1); setMark({})
  }
  const onQuizMove = (from: string, to: string, promotion?: string) => {
    if (!quiz || quiz.state !== 'ask' || !quizFen) return false
    const err = quizErrors[quiz.idx]
    const c = new Chess(quizFen)
    const uci = from + to + (promotion ?? '')
    try { new Chess(quizFen).move({ from, to, promotion }) } catch { return false }
    const right = isCorrectMove(c, uci, err.best)
    c.move({ from, to, promotion }); setQuizFen(c.fen())
    setMark({ [to]: right ? OK : BAD, ...(right ? {} : { [err.best.slice(0, 2)]: BEST, [err.best.slice(2, 4)]: BEST }) })
    setQuiz({ ...quiz, state: right ? 'right' : 'wrong', score: quiz.score + (right ? 1 : 0), tried: quiz.tried + 1 })
    return true
  }

  const markReviewed = async () => {
    if (!game) return
    const first = !game.reviewed
    await db.games.update(game.id, { reviewed: true })
    if (first) { await addXp('game_review', XP.gameReviewed, game.id); show(`Game reviewed +${XP.gameReviewed} XP`) }
  }

  if (!game) return <p>Game not found. <Link to="/review">Back</Link></p>
  const orientation = game.userColor === 'w' ? 'white' : 'black'
  const fen = quizFen ?? fens[ply]
  const ev = game.evals?.[ply - 1]
  const whiteWin = ev ? winPct(ev.mate != null ? (ev.mate > 0 ? 1000 : -1000) : ev.cp) : 50
  const evalText = ev ? (ev.mate != null ? `M${Math.abs(ev.mate)}` : (ev.cp / 100).toFixed(1)) : '0.0'
  const curErr: GameError | undefined = quiz ? quizErrors[quiz.idx] : errorsByPly.get(ply)
  const opp = game.userColor === 'w' ? game.black : game.white
  const cats = (game.errors ?? []).filter((e) => e.severity !== 'inaccuracy').reduce<Record<string, number>>((a, e) => { a[e.category] = (a[e.category] ?? 0) + 1; return a }, {})

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow"><Link to="/review">Games</Link> · {game.speed} · {new Date(game.playedAt).toLocaleDateString()}</div><h1>{game.userColor === 'w' ? 'White' : 'Black'} vs {opp} · {game.result}</h1></div>
        <div className="row">
          {game.url && <a className="btn sm" href={game.url} target="_blank" rel="noreferrer">Open on {game.source}</a>}
          {!game.analysed && progress == null && <button className="btn primary" onClick={analyse}>Analyse with engine</button>}
          {progress != null && <button className="btn" onClick={() => abortRef.current?.abort()}>Stop ({progress}%)</button>}
        </div>
      </div>
      {progress != null && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}

      <div className="two-col">
        <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 8 }}>
          <div title={`Eval ${evalText}`} style={{ borderRadius: 6, overflow: 'hidden', background: '#2a2a2a', border: '1px solid var(--line)', display: 'flex', flexDirection: orientation === 'white' ? 'column' : 'column-reverse' }}>
            <div style={{ flex: `${100 - whiteWin} 0 0`, transition: 'flex .3s' }} /><div style={{ flex: `${whiteWin} 0 0`, background: '#e8e4d6', transition: 'flex .3s' }} />
          </div>
          <div className="board-wrap"><Board fen={fen} orientation={orientation} interactive={!!quiz && quiz.state === 'ask'} onMove={onQuizMove} lastMove={quiz ? null : lastMove} highlights={mark} id="review" animationMs={120} /></div>
        </div>

        <div className="stack">
          {quiz ? (
            <div className="card">
              <div className="eyebrow">Guess the move · {quiz.idx + 1}/{quizErrors.length}</div>
              <h3 style={{ marginTop: 4 }}>{quiz.state === 'ask' ? `You played ${curErr?.san} here (${curErr?.severity}). What was better?` : quiz.state === 'right' ? `✓ ${curErr?.bestSan} — exactly.` : `Engine preferred ${curErr?.bestSan}.`}</h3>
              {quiz.state !== 'ask' && curErr && <p className="muted" style={{ marginTop: 6 }}>Category: <strong>{CAT_LABEL[curErr.category]}</strong> · win chance fell {curErr.lossPct}%.</p>}
              <div className="row" style={{ marginTop: 10 }}>
                {quiz.state === 'ask' && <button className="btn" onClick={() => { const e = quizErrors[quiz.idx]; setMark({ [e.best.slice(0, 2)]: BEST, [e.best.slice(2, 4)]: BEST }); setQuiz({ ...quiz, state: 'wrong', tried: quiz.tried + 1 }) }}>Show answer</button>}
                {quiz.state !== 'ask' && <button className="btn primary" onClick={nextQuiz}>{quiz.idx + 1 < quizErrors.length ? 'Next →' : 'Finish'}</button>}
                <button className="btn ghost" onClick={() => { setQuiz(null); setQuizFen(null); setMark({}) }}>Exit quiz</button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>Move {Math.ceil(ply / 2)}{ply ? (ply % 2 ? '.' : '…') : ''} {sans[ply - 1] ?? 'start'} {errorsByPly.get(ply) && <span className={`pill ${errorsByPly.get(ply)!.severity === 'blunder' ? 'bad' : 'warn'}`}>{SEV_MARK[errorsByPly.get(ply)!.severity]}</span>}</h3>
                <span className="mono muted">{game.analysed ? evalText : ''}</span>
              </div>
              {curErr && <p style={{ marginTop: 6 }}>Better was <strong>{curErr.bestSan}</strong> · {CAT_LABEL[curErr.category]} · −{curErr.lossPct}% win chance.</p>}
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm" onClick={() => setPly(0)}>⏮</button><button className="btn sm" onClick={() => setPly((p) => Math.max(0, p - 1))}>←</button>
                <button className="btn sm" onClick={() => setPly((p) => Math.min(sans.length, p + 1))}>→</button><button className="btn sm" onClick={() => setPly(sans.length)}>⏭</button>
                {game.analysed && quizErrors.length > 0 && <button className="btn primary sm" onClick={startQuiz}>Guess the moves ({quizErrors.length})</button>}
                {game.analysed && <button className={`btn sm ${game.reviewed ? '' : 'primary'}`} onClick={markReviewed} disabled={game.reviewed}>{game.reviewed ? 'Reviewed ✓' : 'Mark reviewed'}</button>}
              </div>
            </div>
          )}

          {game.summary && (
            <div className="card flat">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="eyebrow">Your accuracy</span>
                <span className="row" style={{ gap: 6 }}><span className="pill bad mono">{game.summary.blunders} ??</span><span className="pill warn mono">{game.summary.mistakes} ?</span><span className="pill mono">{game.summary.inaccuracies} ?!</span><span className="pill mono">ACPL {game.summary.acpl}</span></span>
              </div>
              {Object.keys(cats).length > 0 && <div className="row" style={{ marginTop: 8 }}>{Object.entries(cats).map(([c, n]) => <span key={c} className="pill">{CAT_LABEL[c as keyof typeof CAT_LABEL]} · {n}</span>)}</div>}
            </div>
          )}

          <div className="card flat" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <div className="eyebrow">Moves</div>
            <p className="mono" style={{ fontSize: 14, lineHeight: 1.9, marginTop: 6 }}>
              {sans.map((s, i) => { const p = i + 1; const e = errorsByPly.get(p); return (
                <span key={i}>
                  {i % 2 === 0 && <span className="muted">{i / 2 + 1}. </span>}
                  <button onClick={() => { setQuiz(null); setQuizFen(null); setMark({}); setPly(p) }} style={{ background: ply === p ? 'var(--accent-soft)' : e ? (e.severity === 'blunder' ? 'color-mix(in srgb, var(--bad) 25%, transparent)' : 'color-mix(in srgb, var(--warn) 25%, transparent)') : 'transparent', border: 0, padding: '0 4px', borderRadius: 4, font: 'inherit', cursor: 'pointer' }}>{s}{e ? SEV_MARK[e.severity] : ''}</button>{' '}
                </span>) })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
