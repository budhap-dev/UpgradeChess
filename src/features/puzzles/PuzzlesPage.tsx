import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useSettings } from '@/shared/hooks/useSettings'
import { useLichessRatings } from '@/features/progress/useExternalRatings'
import { MOTIFS, MOTIF_LABEL } from '@/config/themes'
import { PuzzleTrainer } from './PuzzleTrainer'
import { StormMode } from './StormMode'
import { WoodpeckerMode } from './WoodpeckerMode'
import type { Mode } from './usePuzzleSession'

export default function PuzzlesPage() {
  const { theme } = useParams()
  const [sp] = useSearchParams()
  const mode: Mode = (sp.get('mode') as Mode) ?? (theme ? 'themed' : 'rated')
  const rating = usePlayerRating('tactics')
  const [settings] = useSettings()
  const li = useLichessRatings(settings.lichessUser)
  const liPuzzle = li.data && !li.data.notFound ? li.data.rows.find((r) => r.perf === 'puzzle')?.rating : undefined
  const [showThemes, setShowThemes] = useState(!theme && mode === 'rated')
  const title = { rated: 'Rated puzzles', streak: 'Puzzle Streak', storm: 'Puzzle Storm', woodpecker: 'Woodpecker', themed: MOTIF_LABEL[theme ?? ''] ?? theme }[mode]

  const modes = (
    <div className="card flat">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>Modes</strong>
        <button className="btn sm ghost" onClick={() => setShowThemes((v) => !v)}>{showThemes ? 'Hide themes' : 'Themes'}</button>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <Link className={`btn sm ${mode === 'rated' ? 'primary' : ''}`} to="/puzzles">Rated</Link>
        <Link className={`btn sm ${mode === 'streak' ? 'primary' : ''}`} to="/puzzles?mode=streak">Streak</Link>
        <Link className={`btn sm ${mode === 'storm' ? 'primary' : ''}`} to="/puzzles?mode=storm">Storm</Link>
        <Link className={`btn sm ${mode === 'woodpecker' ? 'primary' : ''}`} to="/puzzles?mode=woodpecker">Woodpecker</Link>
      </div>
      {showThemes && <div className="row" style={{ marginTop: 10 }}>{MOTIFS.map((m) => <Link key={m.key} className={`btn sm ${theme === m.key ? 'primary' : ''}`} to={`/puzzles/${m.key}`}>{m.label}</Link>)}</div>}
    </div>
  )

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow">Tactics · {mode}</div><h1>{title}</h1></div>
        <span className="row" style={{ gap: 6 }}>
          <span className="pill accent mono" title="Your internal tactics rating (Glicko-2), updated by every rated solve here">Tactics {Math.round(rating.rating)} ± {Math.round(rating.rd)}</span>
          {liPuzzle && <span className="pill mono" title={`Lichess puzzle rating for @${settings.lichessUser}`}>Lichess ♟ {liPuzzle}</span>}
        </span>
      </div>
      {mode === 'storm' ? <StormMode aside={modes} /> : mode === 'woodpecker' ? <WoodpeckerMode aside={modes} /> : <PuzzleTrainer key={mode + (theme ?? '')} mode={mode} theme={theme} aside={modes} />}
    </div>
  )
}
