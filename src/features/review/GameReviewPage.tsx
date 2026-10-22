import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '@/shared/ui/Board'
import { HINT_RING } from '@/shared/ui/boardStyles'
import { db, type GameError } from '@/shared/db/db'
import { getEngine } from '@/shared/engine/engine'
import { analyseGame, winPct } from './analysis'
import { addXp } from '@/shared/db/xp'
import { XP } from '@/config/scoring'
import { useToast } from '@/shared/ui/toastStore'
import { isCorrectMove } from '@/shared/chess/puzzle'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

const CAT_LABEL = { opening: 'Opening', tactic: 'Tactic missed', plan: 'Plan / positional', endgame: 'Endgame technique' } as const
const SEV_MARK = { inaccuracy: '?!', mistake: '?', blunder: '??' } as const
const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const BEST = HINT_RING

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

  if (!game) return <div className="card empty-state"><p>Game not found. <Link to="/review">Back to your games</Link></p></div>
  const orientation = game.userColor === 'w' ? 'white' : 'black'
  const fen = quizFen ?? fens[ply]
  const ev = game.evals?.[ply - 1]
  const whiteWin = ev ? winPct(ev.mate != null ? (ev.mate > 0 ? 1000 : -1000) : ev.cp) : 50
  const evalText = ev ? (ev.mate != null ? `M${Math.abs(ev.mate)}` : (ev.cp / 100).toFixed(1)) : '0.0'
  const curErr: GameError | undefined = quiz ? quizErrors[quiz.idx] : errorsByPly.get(ply)
  const opp = game.userColor === 'w' ? game.black : game.white
  const cats = (game.errors ?? []).filter((e) => e.severity !== 'inaccuracy').reduce<Record<string, number>>((a, e) => { a[e.category] = (a[e.category] ?? 0) + 1; return a }, {})

  const plyErr = errorsByPly.get(ply)
  return (
    <div className="stack">
      <PageHead
        eyebrow={<span className="crumbs"><Link to="/review">Games</Link><span aria-hidden="true">/</span><span>{game.speed} · {new Date(game.playedAt).toLocaleDateString()}</span></span>}
        title={`${game.userColor === 'w' ? 'White' : 'Black'} vs ${opp} · ${game.result}`}
        actions={<>
          {game.url && <a className="btn sm" href={game.url} target="_blank" rel="noreferrer"><Icon name="external" size={16} />Open on {game.source}</a>}
          {!game.analysed && progress == null && <button className="btn primary" onClick={analyse}><Icon name="search" size={18} />Analyse with engine</button>}
          {progress != null && <button className="btn" onClick={() => abortRef.current?.abort()}>Stop ({progress}%)</button>}
        </>}
      />
      {progress != null && <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Analysis progress"><span style={{ width: `${progress}%` }} /></div>}

      <div className="two-col">
        <div className="board-col">
          <div className="row nowrap" style={{ alignItems: 'stretch', gap: 8 }}>
            <div className="eval-bar" title={`Eval ${evalText}`} style={{ flexDirection: orientation === 'white' ? 'column' : 'column-reverse' }}>
              <div style={{ flex: `${100 - whiteWin} 0 0` }} /><div className="w" style={{ flex: `${whiteWin} 0 0` }} />
            </div>
            <div className="board-wrap" style={{ flex: 1 }}><Board fen={fen} orientation={orientation} interactive={!!quiz && quiz.state === 'ask'} onMove={onQuizMove} lastMove={quiz ? null : lastMove} highlights={mark} id="review" animationMs={120} /></div>
          </div>
        </div>

        <div className="panel">
          {quiz ? (
            <div className="card stack tight">
              <div className="eyebrow">Guess the move · {quiz.idx + 1}/{quizErrors.length}</div>
              {quiz.state === 'ask' ? <h2>You played {curErr?.san} here ({curErr?.severity}). What was better?</h2> : quiz.state === 'right'
                ? <div className="status-head"><Icon name="check" size={22} strokeWidth={2.4} className="good" /><h2 className="good">{curErr?.bestSan}, exactly.</h2></div>
                : <h2>Engine preferred {curErr?.bestSan}.</h2>}
              {quiz.state !== 'ask' && curErr && <p className="muted">Category: <strong>{CAT_LABEL[curErr.category]}</strong> · win chance fell {curErr.lossPct}%.</p>}
              <div className="row" style={{ marginTop: 6 }}>
                {quiz.state === 'ask' && <button className="btn secondary" onClick={() => { const e = quizErrors[quiz.idx]; setMark({ [e.best.slice(0, 2)]: BEST, [e.best.slice(2, 4)]: BEST }); setQuiz({ ...quiz, state: 'wrong', tried: quiz.tried + 1 }) }}><Icon name="eye" size={18} />Show answer</button>}
                {quiz.state !== 'ask' && <button className="btn primary" onClick={nextQuiz}>{quiz.idx + 1 < quizErrors.length ? <>Next <Icon name="arrow-right" size={18} /></> : 'Finish'}</button>}
                <button className="btn ghost" onClick={() => { setQuiz(null); setQuizFen(null); setMark({}) }}>Exit quiz</button>
              </div>
            </div>
          ) : (
            <div className="card stack tight">
              <div className="row between">
                <h2 className="row" style={{ gap: 8 }}>{ply ? `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'} ${sans[ply - 1]}` : 'Start position'} {plyErr && <span className={`pill ${plyErr.severity === 'blunder' ? 'bad' : 'warn'}`}>{SEV_MARK[plyErr.severity]}</span>}</h2>
                <span className="mono muted">{game.analysed ? evalText : ''}</span>
              </div>
              {curErr && <p>Better was <strong>{curErr.bestSan}</strong> · {CAT_LABEL[curErr.category]} · −{curErr.lossPct}% win chance.</p>}
              <div className="row" style={{ marginTop: 6 }}>
                <span className="row" style={{ gap: 6 }}>
                  <button className="icon-btn" onClick={() => setPly(0)} disabled={ply === 0} aria-label="Start of game" title="Start"><Icon name="first" /></button>
                  <button className="icon-btn" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0} aria-label="Previous move" title="Previous (←)"><Icon name="chevron-left" /></button>
                  <button className="icon-btn" onClick={() => setPly((p) => Math.min(sans.length, p + 1))} disabled={ply >= sans.length} aria-label="Next move" title="Next (→)"><Icon name="chevron-right" /></button>
                  <button className="icon-btn" onClick={() => setPly(sans.length)} disabled={ply >= sans.length} aria-label="End of game" title="End"><Icon name="last" /></button>
                </span>
                {game.analysed && quizErrors.length > 0 && <button className="btn primary" onClick={startQuiz}><Icon name="target" size={18} />Guess the moves ({quizErrors.length})</button>}
                {game.analysed && <button className={`btn ${game.reviewed ? '' : 'primary'}`} onClick={markReviewed} disabled={game.reviewed}>{game.reviewed ? <><Icon name="check" size={18} strokeWidth={2.4} />Reviewed</> : 'Mark reviewed'}</button>}
              </div>
            </div>
          )}

          {game.summary && (
            <div className="card">
              <div className="card-head"><h3>Your accuracy</h3><span className="pill mono">ACPL {game.summary.acpl}</span></div>
              <div className="row" style={{ gap: 6 }}><span className="pill bad mono">{game.summary.blunders} ??</span><span className="pill warn mono">{game.summary.mistakes} ?</span><span className="pill mono">{game.summary.inaccuracies} ?!</span></div>
              {Object.keys(cats).length > 0 && <div className="row" style={{ marginTop: 8, gap: 6 }}>{Object.entries(cats).map(([c, n]) => <span key={c} className="pill outline">{CAT_LABEL[c as keyof typeof CAT_LABEL]} · {n}</span>)}</div>}
            </div>
          )}

          <div className="card">
            <div className="card-head" style={{ marginBottom: 6 }}><h3>Moves</h3></div>
            <p className="moves scroll-y">
              {sans.map((m, i) => { const p = i + 1; const e = errorsByPly.get(p); return (
                <span key={i}>
                  {i % 2 === 0 && <span className="n">{i / 2 + 1}. </span>}
                  <button aria-current={ply === p} className={e && ply !== p ? (e.severity === 'blunder' ? 'blunder' : 'mistake') : undefined} onClick={() => { setQuiz(null); setQuizFen(null); setMark({}); setPly(p) }}>{m}{e ? SEV_MARK[e.severity] : ''}</button>{' '}
                </span>) })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
