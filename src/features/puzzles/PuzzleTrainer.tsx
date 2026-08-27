import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import { Board } from '@/shared/ui/Board'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useSettings } from '@/shared/hooks/useSettings'
import { usePuzzleSession, type Mode, type SessionOptions } from './usePuzzleSession'
import { MOTIF_LABEL } from '@/config/themes'
import { sfx, haptic } from '@/shared/ui/sound'

const HINT: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--info)' }
const WRONG: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 55%, transparent)' }

export interface TrainerProps { mode: Mode; theme?: string; options?: SessionOptions; autoAdvanceMs?: number; locked?: boolean; aside?: ReactNode }

/** Board + status card shared by every puzzle mode. */
export function PuzzleTrainer({ mode, theme, options, autoAdvanceMs, locked, aside }: TrainerProps) {
  const rating = usePlayerRating('tactics')
  const [settings] = useSettings()
  const { state, onMove, next, hint, showSolution, retry, view } = usePuzzleSession(mode, theme, rating.rating, options)
  const highlights = useMemo(() => { const h: Record<string, CSSProperties> = {}; if (state.hintSquare) h[state.hintSquare] = HINT; if (state.wrongSquare) h[state.wrongSquare] = WRONG; return h }, [state.hintSquare, state.wrongSquare])
  const p = state.puzzle
  const viewing = state.viewIdx !== null
  const shown = viewing ? state.history[state.viewIdx!] : null
  const orientation = settings.boardFlipAuto && p ? (p.sideToMove === 'w' ? 'white' : 'black') : 'white'
  const solving = state.status === 'solving' && !locked && !viewing
  const finished = state.status === 'solved' || state.status === 'failed'
  const isRated = mode === 'rated' || mode === 'themed'
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') view(-1); if (e.key === 'ArrowRight') view(1) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [view])
  useEffect(() => { if (state.status === 'solved') { sfx.success(); haptic(30) } else if (state.status === 'failed') { sfx.fail(); haptic([40, 60, 40]) } }, [state.status])
  useEffect(() => { if (finished && autoAdvanceMs && !locked) { const t = setTimeout(next, autoAdvanceMs); return () => clearTimeout(t) } }, [finished, autoAdvanceMs, locked, next, state.puzzle?.id])

  return (
    <div className="trainer">
      <div className="board-wrap trainer-board" data-puzzle-id={p?.id} data-status={state.status}>
        <Board fen={shown ? shown.fen : state.fen} orientation={orientation} interactive={solving} onMove={onMove} lastMove={shown ? shown.lastMove : state.lastMove} highlights={viewing ? {} : highlights} id="puzzle" />
      </div>
      <div className="card trainer-status">
          {state.status === 'loading' && <p className="muted">Finding a puzzle…</p>}
          {state.status === 'empty' && <p>No puzzles available for this mode.</p>}
          {(state.status === 'intro' || state.status === 'solving') && p && (
            <>
              <h3>{p.sideToMove === 'w' ? 'White' : 'Black'} to move</h3>
              <p className="muted">Find the best move. {state.step > 0 && `Good — keep going (${Math.ceil((p.solution.length - state.step) / 2)} to go).`}</p>
              {state.practice && <p className="pill warn" style={{ marginTop: 8 }}>Practice retry — not rated</p>}
            </>
          )}
          {state.status === 'solved' && p && (
            <><h3 style={{ color: 'var(--good)' }}>Solved ✓</h3>
              <p className="row" style={{ marginTop: 6 }}>
                {state.ratingDelta != null && <span className={`pill mono ${state.ratingDelta >= 0 ? 'good' : 'bad'}`}>{state.ratingDelta >= 0 ? '+' : ''}{state.ratingDelta} rating</span>}
                {!!state.xpGained && <span className="pill accent mono">+{state.xpGained} XP</span>}
                {state.practice && <span className="pill">practice</span>}
              </p></>
          )}
          {state.status === 'failed' && p && (
            <><h3 style={{ color: 'var(--bad)' }}>Not quite</h3>
              <p className="row" style={{ marginTop: 6 }}>
                {state.ratingDelta != null && <span className="pill bad mono">{state.ratingDelta} rating</span>}
                {!!state.xpGained && <span className="pill mono">+{state.xpGained} XP</span>}
              </p></>
          )}
          {p && finished && (
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              Puzzle <span className="mono">{p.id}</span> · rated {p.rating} · {p.themes.map((t) => MOTIF_LABEL[t] ?? t).join(', ')}
              {p.gameId && <> · <a href={`https://lichess.org/${p.gameId}`} target="_blank" rel="noreferrer">source game</a></>}
            </p>
          )}
          {!autoAdvanceMs && (
            <div className="row" style={{ marginTop: 12 }}>
              {state.history.length > 1 && state.status !== 'intro' && (
                <>
                  <button className="btn sm" onClick={() => view(-1)} disabled={(state.viewIdx ?? state.history.length - 1) === 0} title="Back one move (←)" aria-label="Back one move">◀</button>
                  <button className="btn sm" onClick={() => view(1)} disabled={!viewing} title="Forward one move (→)" aria-label="Forward one move">▶</button>
                  {viewing && <span className="pill warn mono" style={{ cursor: 'pointer' }} onClick={() => view(null)}>{state.viewIdx}/{state.history.length - 1} · {shown?.san} · live ↩</span>}
                </>
              )}
              {solving && isRated && <button className="btn" onClick={hint}>Hint{state.hints ? ` (${state.hints})` : ''}</button>}
              {state.status === 'failed' && isRated && <button className="btn" onClick={retry}>Retry</button>}
              {state.status === 'failed' && state.step < (p?.solution.length ?? 0) && <button className="btn" onClick={showSolution}>Show solution</button>}
              {finished && <button className="btn primary" onClick={next}>Next puzzle →</button>}
            </div>
          )}
      </div>
      <div className="trainer-aside">{aside}</div>
    </div>
  )
}
