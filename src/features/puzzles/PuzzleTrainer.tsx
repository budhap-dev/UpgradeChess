import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '@/shared/ui/Board'
import { HINT_RING } from '@/shared/ui/boardStyles'
import { Icon } from '@/shared/ui/Icon'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useSettings } from '@/shared/hooks/useSettings'
import { todayProgress } from '@/shared/db/xp'
import { DAILY_GOAL } from '@/config/scoring'
import { usePuzzleSession, type Mode, type SessionOptions } from './usePuzzleSession'
import { useResultsFor, useTrainerResults, sessionDelta } from './sessionStore'
import { MOTIF_LABEL } from '@/config/themes'
import { sfx, haptic } from '@/shared/ui/sound'

const HINT = HINT_RING
const WRONG: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 55%, transparent)' }
const MAX_HINTS = 2
// the centre action changes meaning (Next → Hint) in place; ignore taps right after a change
const CENTRE_GUARD_MS = 500
const SIDE = { w: 'White', b: 'Black' } as const

export interface TrainerProps { mode: Mode; theme?: string; options?: SessionOptions; autoAdvanceMs?: number; locked?: boolean; aside?: ReactNode }

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null
  return e.metaKey || e.ctrlKey || e.altKey || !!t?.closest('input, textarea, select, [contenteditable="true"]')
}
const fmtMs = (ms: number) => { const s = Math.round(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s` }

function Elapsed({ since, running }: { since: number; running: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { if (!running) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [running, since])
  if (!since) return null
  const s = Math.max(0, Math.floor((now - since) / 1000))
  return <span className="mono timer" aria-label="Time on this puzzle">{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>
}

/** Board + status card shared by every puzzle mode. */
export function PuzzleTrainer({ mode, theme, options, autoAdvanceMs, locked, aside }: TrainerProps) {
  const rating = usePlayerRating('tactics')
  const [settings] = useSettings()
  const { state, onMove, next, hint, showSolution, retry, view } = usePuzzleSession(mode, theme, rating.rating, { ...options, persist: (mode === 'rated' || mode === 'themed') && !autoAdvanceMs && !options?.queue })
  const resultsKey = `${mode}|${theme ?? ''}`
  const results = useResultsFor(resultsKey)
  const addResult = useTrainerResults((s) => s.add)
  const today = useLiveQuery(() => todayProgress(), []) ?? { puzzles: 0, lessonsOrDrills: 0, goalHit: false }
  const [flipped, setFlipped] = useState(false)
  const p = state.puzzle
  const hintTo = state.hints >= 2 && state.status === 'solving' && p ? p.solution[state.step]?.slice(2, 4) : null
  const highlights = useMemo(() => {
    const h: Record<string, CSSProperties> = {}
    if (state.hintSquare) h[state.hintSquare] = HINT
    if (hintTo) h[hintTo] = HINT
    if (state.wrongSquare) h[state.wrongSquare] = WRONG
    return h
  }, [state.hintSquare, hintTo, state.wrongSquare])
  const viewing = state.viewIdx !== null
  const shown = viewing ? state.history[state.viewIdx!] : null
  const baseOrientation = settings.boardFlipAuto && p ? (p.sideToMove === 'w' ? 'white' : 'black') : 'white'
  const orientation = flipped ? (baseOrientation === 'white' ? 'black' : 'white') : baseOrientation
  const solving = state.status === 'solving' && !locked && !viewing
  const finished = state.status === 'solved' || state.status === 'failed'
  const isRated = mode === 'rated' || mode === 'themed'
  const canHint = solving && isRated && !autoAdvanceMs && state.hints < MAX_HINTS
  const canStep = state.history.length > 1 && state.status !== 'intro'
  const atStart = (state.viewIdx ?? state.history.length - 1) === 0
  const solutionShown = state.status === 'failed' && state.step >= (p?.solution.length ?? 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e)) return
      const k = e.key.toLowerCase()
      if (e.key === 'ArrowLeft') view(-1)
      else if (e.key === 'ArrowRight') view(1)
      else if (k === 'f') setFlipped((v) => !v)
      else if (k === 'h' && canHint) hint()
      else if (k === 'n' && finished && !autoAdvanceMs) void next()
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [view, hint, next, canHint, finished, autoAdvanceMs])
  const statusAt = useRef(0)
  useEffect(() => { statusAt.current = Date.now() }, [state.status, p?.id])
  const centre = (fn: () => void) => () => { if (Date.now() - statusAt.current >= CENTRE_GUARD_MS) fn() }
  useEffect(() => { if (state.status === 'solved') { sfx.success(); haptic(30) } else if (state.status === 'failed') { sfx.fail(); haptic([40, 60, 40]) } }, [state.status])
  useEffect(() => { if (finished && autoAdvanceMs && !locked) { const t = setTimeout(next, autoAdvanceMs); return () => clearTimeout(t) } }, [finished, autoAdvanceMs, locked, next, state.puzzle?.id])
  useEffect(() => {
    if (finished && p && !state.practice) addResult(resultsKey, { id: p.id, solved: state.status === 'solved', delta: state.ratingDelta, ms: Date.now() - state.startedAt })
    // record once per finished puzzle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, p?.id, state.ratingDelta])

  const topSide = orientation === 'white' ? 'b' : 'w'
  // the opponent's most recent move up to the position on the board (a move was made by the side not to move after it)
  const oppLast = p ? state.history.slice(0, (state.viewIdx ?? state.history.length - 1) + 1).reverse().find((h) => h.san !== 'start' && h.fen.split(' ')[1] === p.sideToMove)?.san : undefined
  const strip = (side: 'w' | 'b') => {
    const mine = p ? side === p.sideToMove : side === (orientation === 'white' ? 'w' : 'b')
    return <><span className={`side-swatch ${side}`} aria-hidden="true" /><strong>{mine ? 'You' : SIDE[side]}</strong><span className="muted">· {mine ? SIDE[side] : oppLast ? `last move ${oppLast}` : 'opponent'}</span></>
  }
  const solvedCount = results.filter((r) => r.solved).length
  const delta = sessionDelta(results)
  const goalSegs = Math.max(DAILY_GOAL.puzzles, 1)
  const toMove = p ? SIDE[p.sideToMove] : ''

  return (
    <div className="trainer" data-mode={mode}>
      <div className="trainer-board-col">
        <div className="player-strip desk-only">{strip(topSide)}</div>
        <div className="board-wrap trainer-board" data-puzzle-id={p?.id} data-status={state.status}>
          <Board fen={shown ? shown.fen : state.fen} orientation={orientation} interactive={solving} onMove={onMove} lastMove={shown ? shown.lastMove : state.lastMove} highlights={viewing ? {} : highlights} id="puzzle" />
        </div>
        <div className="board-tools desk-only">
          <div className="player-strip">{strip(topSide === 'w' ? 'b' : 'w')}</div>
          <div className="tools">
            <button className="icon-btn" onClick={() => setFlipped((v) => !v)} title="Flip board (F)" aria-label="Flip board"><Icon name="flip" /></button>
            <button className="icon-btn" onClick={() => view(-1)} disabled={!canStep || atStart} title="Previous move (←)" aria-label="Previous move"><Icon name="chevron-left" /></button>
            <button className="icon-btn" onClick={() => view(1)} disabled={!viewing} title="Next move (→)" aria-label="Next move"><Icon name="chevron-right" /></button>
          </div>
        </div>
        {viewing && <button className="pill warn mono viewing-pill" onClick={() => view(null)}>Viewing {state.viewIdx}/{state.history.length - 1} · {shown?.san} · back to live</button>}
      </div>

      <div className="trainer-panel">
        <section className="card trainer-status" data-state={state.status} aria-live="polite">
          {state.status === 'loading' && <p className="muted">Finding a puzzle…</p>}
          {state.status === 'empty' && <p>No puzzles available for this mode.</p>}
          {(state.status === 'intro' || state.status === 'solving') && p && (
            <>
              <div className="status-head">
                <span className={`side-swatch ${p.sideToMove}`} aria-hidden="true" />
                <h2>{toMove} to move</h2>
                <Elapsed since={state.startedAt} running={state.status === 'solving'} />
              </div>
              <p className="muted status-line">
                {/* phones show the hint in this one line; desktop uses the callout below */}
                {state.hints > 0 && <span className="mob-only warn">Hint {Math.min(state.hints, MAX_HINTS)}/{MAX_HINTS}: {state.hints >= 2 ? 'ringed piece to the ringed square' : 'the ringed piece moves first'} · unrated</span>}
                <span className={state.hints > 0 ? 'desk-only' : undefined}>
                  {state.step > 0 ? `Good, keep going (${Math.ceil((p.solution.length - state.step) / 2)} to go)` : 'Find the best move'}
                  <span className="mob-only"> · {state.practice ? 'practice, not rated' : `rated ${p.rating}`}</span>
                </span>
              </p>
              <div className="row desk-only status-pills">
                <span className="pill mono">Rated {p.rating}</span>
                <span className="pill">Themes hidden until solved</span>
                {state.practice && <span className="pill warn">Practice, not rated</span>}
              </div>
            </>
          )}
          {state.status === 'solved' && p && (
            <>
              <div className="status-head"><Icon name="check" size={24} strokeWidth={2.4} className="good" /><h2 className="good">Solved</h2></div>
              <div className="row status-pills">
                {state.ratingDelta != null && <span className={`pill mono ${state.ratingDelta >= 0 ? 'good' : 'bad'}`}>{state.ratingDelta >= 0 ? '+' : ''}{state.ratingDelta} rating</span>}
                {!!state.xpGained && <span className="pill accent mono">+{state.xpGained} XP</span>}
                {state.practice && <span className="pill">practice</span>}
              </div>
            </>
          )}
          {state.status === 'failed' && p && (
            <>
              <div className="status-head"><Icon name="x" size={24} strokeWidth={2.4} className="bad" /><h2 className="bad">Not quite</h2></div>
              <div className="row status-pills">
                {state.ratingDelta != null && <span className="pill bad mono">{state.ratingDelta} rating</span>}
                {!!state.xpGained && <span className="pill mono">+{state.xpGained} XP</span>}
              </div>
            </>
          )}
          {p && finished && (
            <p className="muted status-meta">
              {p.themes.map((t) => MOTIF_LABEL[t] ?? t).join(', ')} · rated {p.rating} · <span className="mono">#{p.id}</span>
              {p.gameId && <> · <a href={`https://lichess.org/${p.gameId}`} target="_blank" rel="noreferrer">source game</a></>}
            </p>
          )}
          {state.hints > 0 && !finished && (
            <div className="callout warn desk-only">
              <Icon name="bulb" size={18} />
              <span>Hint {Math.min(state.hints, MAX_HINTS)} of {MAX_HINTS}: {state.hints >= 2 ? 'move the ringed piece to the ringed square.' : 'the ringed piece makes the first move.'} Hinted puzzles are unrated and earn half XP.</span>
            </div>
          )}
          {!autoAdvanceMs && p && (
            <div className="status-actions" data-state={state.status}>
              {solving && isRated && state.hints < MAX_HINTS && <button className="btn secondary" onClick={hint}><Icon name="bulb" size={18} />{state.hints ? 'Another hint' : 'Hint'}</button>}
              {solving && <button className="btn ghost" onClick={() => void next()}><Icon name="skip" size={18} />Skip</button>}
              {state.status === 'failed' && isRated && <button className="btn secondary" onClick={retry}><Icon name="retry" size={18} />Retry</button>}
              {state.status === 'failed' && !solutionShown && <button className="btn secondary" onClick={showSolution}><Icon name="eye" size={18} />Show solution</button>}
              {state.status === 'failed' && <button className="btn ghost" onClick={() => void next()}>Next puzzle <Icon name="arrow-right" size={18} /></button>}
              {state.status === 'solved' && <button className="btn primary" onClick={() => void next()}>Next puzzle <Icon name="arrow-right" size={18} /></button>}
            </div>
          )}
        </section>

        {!autoAdvanceMs && (
          <section className="card desk-only" aria-labelledby="session-h">
            <div className="card-head">
              <h3 id="session-h">This session</h3>
              {isRated && results.length > 0 && <span className={`delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}`}>{delta > 0 ? '+' : ''}{delta} rating</span>}
            </div>
            <div className="result-row" aria-label={`${solvedCount} of ${results.length} solved`}>
              {results.slice(-14).map((r, i) => <span key={r.id + i} className={`result-sq ${r.solved ? 'ok' : 'ko'}`}><Icon name={r.solved ? 'check' : 'x'} size={16} strokeWidth={2.4} /></span>)}
              <span className="result-sq empty" aria-hidden="true" />
            </div>
            <div className="mini-stats" style={{ marginTop: 14 }}>
              <div><span className="v">{Math.round(rating.rating)}<span className="muted" style={{ fontSize: 12 }}> ±{Math.round(rating.rd)}</span></span><span className="l">Rating</span></div>
              <div><span className="v">{results.length ? `${Math.round((solvedCount / results.length) * 100)}%` : '—'}</span><span className="l">Accuracy</span></div>
              <div><span className="v">{results.length ? fmtMs(results.reduce((a, r) => a + r.ms, 0) / results.length) : '—'}</span><span className="l">Avg time</span></div>
            </div>
          </section>
        )}

        {!autoAdvanceMs && (
          <section className="session-strip mob-only" aria-label="Today">
            <div className="row between"><strong>This session</strong><span className="mono muted">{Math.min(today.puzzles, DAILY_GOAL.puzzles)} / {DAILY_GOAL.puzzles} today</span></div>
            <div className="seg-bar" aria-hidden="true">
              {Array.from({ length: goalSegs }, (_, i) => { const r = results.slice(-goalSegs)[i]; return <span key={i} className={r ? (r.solved ? 'ok' : 'ko') : ''} /> })}
            </div>
          </section>
        )}

        {aside}

        {!autoAdvanceMs && (
          <section className="card desk-only">
            <div className="row between"><h3>Daily goal</h3><span className="mono muted">{Math.min(today.puzzles, DAILY_GOAL.puzzles)} / {DAILY_GOAL.puzzles}</span></div>
            <div className="progress" style={{ marginTop: 10 }}><span style={{ width: `${Math.min(100, (today.puzzles / DAILY_GOAL.puzzles) * 100)}%` }} /></div>
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}><kbd>H</kbd> hint · <kbd>F</kbd> flip · <kbd>←</kbd> <kbd>→</kbd> step · <kbd>N</kbd> next</p>
          </section>
        )}
      </div>

      <nav className="action-bar mob-only" aria-label="Puzzle controls">
        <button onClick={() => setFlipped((v) => !v)} aria-label="Flip board"><Icon name="flip" size={22} /><span>Flip</span></button>
        <button onClick={() => view(-1)} disabled={!canStep || atStart} aria-label="Previous move"><Icon name="chevron-left" size={22} /><span>Back</span></button>
        {state.status === 'solved' || (state.status === 'failed' && (!isRated || autoAdvanceMs))
          ? <button className="centre" onClick={centre(() => void next())} disabled={!!autoAdvanceMs}><Icon name="arrow-right" size={22} /><span>Next</span></button>
          : state.status === 'failed'
            ? <button className="centre" onClick={centre(retry)}><Icon name="retry" size={22} /><span>Retry</span></button>
            : <button className="centre quiet" onClick={centre(hint)} disabled={!canHint} aria-label="Hint (makes this puzzle unrated)"><Icon name="bulb" size={22} /><span>Hint</span></button>}
        {state.status === 'failed' && !solutionShown && !autoAdvanceMs
          ? <button onClick={showSolution}><Icon name="eye" size={22} /><span>Solution</span></button>
          : <button onClick={() => view(1)} disabled={!viewing} aria-label="Next move"><Icon name="chevron-right" size={22} /><span>Forward</span></button>}
        {state.status === 'failed' && isRated && !autoAdvanceMs
          ? <button onClick={() => void next()}><Icon name="skip" size={22} /><span>Next</span></button>
          : <button onClick={() => void next()} disabled={!solving || !!autoAdvanceMs}><Icon name="skip" size={22} /><span>Skip</span></button>}
      </nav>
    </div>
  )
}
