import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Board } from '@/shared/ui/Board'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { usePuzzleSession, type Mode } from './usePuzzleSession'
import { MOTIFS, MOTIF_LABEL } from '@/config/themes'
import { useSettings } from '@/shared/hooks/useSettings'

const HINT: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--info)' }
const WRONG: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 55%, transparent)' }

export default function PuzzlesPage() {
  const { theme } = useParams()
  const [sp] = useSearchParams()
  const mode: Mode = (sp.get('mode') as Mode) ?? (theme ? 'themed' : 'rated')
  const rating = usePlayerRating('tactics')
  const [settings] = useSettings()
  const { state, onMove, next, hint, showSolution, retry } = usePuzzleSession(mode, theme, rating.rating)
  const [showThemes, setShowThemes] = useState(!theme && mode === 'rated')

  const highlights = useMemo(() => {
    const h: Record<string, CSSProperties> = {}
    if (state.hintSquare) h[state.hintSquare] = HINT
    if (state.wrongSquare) h[state.wrongSquare] = WRONG
    return h
  }, [state.hintSquare, state.wrongSquare])

  const p = state.puzzle
  const orientation = settings.boardFlipAuto && p ? (p.sideToMove === 'w' ? 'white' : 'black') : 'white'
  const solving = state.status === 'solving'
  const title = mode === 'streak' ? 'Puzzle Streak' : mode === 'themed' ? MOTIF_LABEL[theme ?? ''] ?? theme : 'Rated puzzles'

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <div className="eyebrow">Tactics · {mode}</div>
          <h1>{title}</h1>
        </div>
        <div className="row">
          <span className="pill accent mono" title="Your internal tactics rating (Glicko-2)">Tactics {Math.round(rating.rating)} ± {Math.round(rating.rd)}</span>
          {mode === 'streak' && <span className="pill good mono">Streak {state.streakCount}</span>}
        </div>
      </div>

      <div className="two-col">
        <div className="board-wrap" data-puzzle-id={p?.id} data-status={state.status}>
          <Board fen={state.fen} orientation={orientation} interactive={solving} onMove={onMove} lastMove={state.lastMove} highlights={highlights} id="puzzle" />
        </div>

        <div className="stack">
          <div className="card">
            {state.status === 'loading' && <p className="muted">Finding a puzzle near {Math.round(rating.rating)}…</p>}
            {state.status === 'empty' && <p>No puzzles available offline yet. Connect once to download the starter pack.</p>}
            {(state.status === 'intro' || solving) && p && (
              <>
                <h3>{p.sideToMove === 'w' ? 'White' : 'Black'} to move</h3>
                <p className="muted">Find the best move. {state.step > 0 && `Good — keep going (${Math.ceil((p.solution.length - state.step) / 2)} to go).`}</p>
                {state.practice && <p className="pill warn" style={{ marginTop: 8 }}>Practice retry — not rated</p>}
              </>
            )}
            {state.status === 'solved' && p && (
              <>
                <h3 style={{ color: 'var(--good)' }}>Solved ✓</h3>
                <p className="row" style={{ marginTop: 6 }}>
                  {state.ratingDelta != null && <span className={`pill mono ${state.ratingDelta >= 0 ? 'good' : 'bad'}`}>{state.ratingDelta >= 0 ? '+' : ''}{state.ratingDelta} rating</span>}
                  {state.xpGained != null && <span className="pill accent mono">+{state.xpGained} XP</span>}
                  {state.practice && <span className="pill">practice</span>}
                </p>
              </>
            )}
            {state.status === 'failed' && p && (
              <>
                <h3 style={{ color: 'var(--bad)' }}>Not quite</h3>
                <p className="row" style={{ marginTop: 6 }}>
                  {state.ratingDelta != null && <span className="pill bad mono">{state.ratingDelta} rating</span>}
                  {state.xpGained != null && <span className="pill mono">+{state.xpGained} XP</span>}
                </p>
              </>
            )}
            {p && (state.status === 'solved' || state.status === 'failed') && (
              <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
                Puzzle <span className="mono">{p.id}</span> · rated {p.rating} · themes: {p.themes.map((t) => MOTIF_LABEL[t] ?? t).join(', ')}
                {p.gameId && <> · <a href={`https://lichess.org/${p.gameId}`} target="_blank" rel="noreferrer">source game</a></>}
              </p>
            )}
            <div className="row" style={{ marginTop: 12 }}>
              {solving && <button className="btn" onClick={hint}>Hint{state.hints ? ` (${state.hints})` : ''}</button>}
              {state.status === 'failed' && <button className="btn" onClick={retry}>Retry</button>}
              {state.status === 'failed' && state.step < (p?.solution.length ?? 0) && <button className="btn" onClick={showSolution}>Show solution</button>}
              {(state.status === 'solved' || state.status === 'failed') && <button className="btn primary" onClick={next}>Next puzzle →</button>}
            </div>
          </div>

          <div className="card flat">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>Modes</strong>
              <button className="btn sm ghost" onClick={() => setShowThemes((v) => !v)}>{showThemes ? 'Hide themes' : 'Themes'}</button>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <Link className={`btn sm ${mode === 'rated' ? 'primary' : ''}`} to="/puzzles">Rated</Link>
              <Link className={`btn sm ${mode === 'streak' ? 'primary' : ''}`} to="/puzzles?mode=streak">Streak</Link>
            </div>
            {showThemes && (
              <div className="row" style={{ marginTop: 10 }}>
                {MOTIFS.map((m) => <Link key={m.key} className={`btn sm ${theme === m.key ? 'primary' : ''}`} to={`/puzzles/${m.key}`}>{m.label}</Link>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
