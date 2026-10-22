import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useSettings } from '@/shared/hooks/useSettings'
import { useLichessRatings } from '@/features/progress/useExternalRatings'
import { MOTIFS, MOTIF_LABEL } from '@/config/themes'
import { Icon } from '@/shared/ui/Icon'
import { PuzzleTrainer } from './PuzzleTrainer'
import { StormMode } from './StormMode'
import { WoodpeckerMode } from './WoodpeckerMode'
import { useResultsFor, sessionDelta } from './sessionStore'
import type { Mode } from './usePuzzleSession'

const MODES: { mode: Mode; label: string; to?: string }[] = [
  { mode: 'rated', label: 'Rated', to: '/puzzles' },
  { mode: 'themed', label: 'Themed' },
  { mode: 'streak', label: 'Streak', to: '/puzzles?mode=streak' },
  { mode: 'storm', label: 'Storm', to: '/puzzles?mode=storm' },
  { mode: 'woodpecker', label: 'Woodpecker', to: '/puzzles?mode=woodpecker' },
]

export default function PuzzlesPage() {
  const { theme } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const mode: Mode = (sp.get('mode') as Mode) ?? (theme ? 'themed' : 'rated')
  const startId = mode === 'rated' ? sp.get('puzzle') ?? undefined : undefined
  const rating = usePlayerRating('tactics')
  const [settings] = useSettings()
  const li = useLichessRatings(settings.lichessUser)
  const liPuzzle = li.data && !li.data.notFound ? li.data.rows.find((r) => r.perf === 'puzzle')?.rating : undefined
  const [showThemes, setShowThemes] = useState(mode === 'themed')
  const delta = sessionDelta(useResultsFor(`${mode}|${theme ?? ''}`))
  const title = { rated: 'Rated puzzles', streak: 'Puzzle Streak', storm: 'Puzzle Storm', woodpecker: 'Woodpecker', themed: MOTIF_LABEL[theme ?? ''] ?? theme }[mode]
  const themesOpen = showThemes || mode === 'themed'

  const tab = (m: (typeof MODES)[number], cls: string) => {
    const selected = m.mode === mode
    if (!m.to) return <button key={m.mode} role="tab" type="button" className={cls} aria-selected={selected} aria-expanded={themesOpen} aria-controls="theme-picker" onClick={() => setShowThemes((v) => !v)}>{m.label}</button>
    return <Link key={m.mode} role="tab" className={cls} aria-selected={selected} to={m.to} onClick={() => setShowThemes(false)}>{m.label}</Link>
  }

  return (
    <div className="stack">
      {/* Phone app bar */}
      <div className="app-bar mob-only">
        <button className="icon-btn plain" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="Back"><Icon name="chevron-left" size={24} /></button>
        <h1 className="title">{title}</h1>
        <span className="rating-chip" title="Tactics rating · change this session">{Math.round(rating.rating)}{delta !== 0 && <span className={delta > 0 ? 'good' : 'bad'} style={{ fontSize: 12 }}>{delta > 0 ? '+' : ''}{delta}</span>}</span>
      </div>
      <div className="chip-row mob-only" role="tablist" aria-label="Puzzle modes">{MODES.map((m) => tab(m, 'chip'))}</div>

      {/* Desktop header */}
      <header className="page-head desk-only">
        <div className="titles">
          <nav className="eyebrow crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span>Puzzles</span></nav>
          <h1>{title}</h1>
          <div className="row" style={{ gap: 6 }}>
            <span className="pill accent mono" title="Your internal tactics rating (Glicko-2), updated by every rated solve here">Tactics {Math.round(rating.rating)} ± {Math.round(rating.rd)}</span>
            {liPuzzle && <span className="pill mono" title={`Lichess puzzle rating for @${settings.lichessUser}`}>Lichess {liPuzzle}</span>}
          </div>
        </div>
        <div className="segmented" role="tablist" aria-label="Puzzle modes">{MODES.map((m) => tab(m, ''))}</div>
      </header>

      {themesOpen && (
        <div id="theme-picker" className="chip-row" aria-label="Themes">
          {MOTIFS.map((m) => <Link key={m.key} className={`chip${theme === m.key ? ' active' : ''}`} aria-current={theme === m.key ? 'page' : undefined} to={`/puzzles/${m.key}`}>{m.label}</Link>)}
        </div>
      )}

      {mode === 'storm' ? <StormMode /> : mode === 'woodpecker' ? <WoodpeckerMode /> : <PuzzleTrainer key={mode + (theme ?? '') + (startId ?? '')} mode={mode} theme={theme} options={startId ? { startId } : undefined} />}
    </div>
  )
}
