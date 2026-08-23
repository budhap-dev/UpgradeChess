import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/db'
import { CURRICULUM, TRACK_LABEL, BAND_LABEL } from './curriculum'
import { nodeStates, routeFor, ICON } from './progression'
import type { Track, Band } from './types'

const TRACKS: Track[] = ['tactics', 'endgames', 'openings', 'strategy']
const BANDS: Band[] = ['foundation', 'club', 'strong']

export default function PathPage() {
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? []
  const attempts = useLiveQuery(() => db.puzzleAttempts.orderBy('ts').reverse().limit(500).toArray(), []) ?? []
  const states = nodeStates(CURRICULUM, progress, attempts)
  const mastered = CURRICULUM.filter((n) => states[n.id].state === 'mastered').length

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow">Learning path</div><h1>Your path</h1></div>
        <span className="pill accent mono">{mastered}/{CURRICULUM.length} mastered</span>
      </div>
      <div className="progress"><span style={{ width: `${Math.round((mastered / CURRICULUM.length) * 100)}%` }} /></div>
      <p className="muted">Lessons teach the idea, drills prove it. Nodes unlock when their prerequisites are mastered; themed drills are judged on your last puzzles of that motif.</p>
      {TRACKS.map((track) => (
        <section key={track} className="stack">
          <h2 style={{ marginTop: 12 }}>{TRACK_LABEL[track]}</h2>
          {BANDS.map((band) => {
            const nodes = CURRICULUM.filter((n) => n.track === track && n.band === band)
            if (!nodes.length) return null
            return (
              <div key={band}>
                <div className="eyebrow" style={{ margin: '6px 0' }}>{BAND_LABEL[band]}</div>
                <ul className="list">
                  {nodes.map((n) => {
                    const s = states[n.id]
                    const inner = (
                      <>
                        <span className="mark">{s.state === 'mastered' ? '✓' : s.state === 'locked' ? '🔒' : ICON[n.kind]}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <strong>{n.title}</strong>
                          <br /><span className="muted" style={{ fontSize: 14 }}>{s.state === 'locked' ? s.detail : n.blurb}{s.state !== 'locked' && s.detail ? ` · ${s.detail}` : ''}</span>
                        </span>
                        <span className="pill mono">{s.state === 'mastered' ? 'done' : `+${n.xp} XP`}</span>
                      </>
                    )
                    return s.state === 'locked'
                      ? <li key={n.id} className="node locked" aria-disabled>{inner}</li>
                      : <Link key={n.id} to={routeFor(n)} className={`node ${s.state}`}>{inner}</Link>
                  })}
                </ul>
              </div>
            )
          })}
        </section>
      ))}
    </div>
  )
}
