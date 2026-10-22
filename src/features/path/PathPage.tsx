import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/db'
import { CURRICULUM, TRACK_LABEL, BAND_LABEL } from './curriculum'
import { nodeStates, routeFor, ICON } from './progression'
import type { Track, Band } from './types'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

const TRACKS: Track[] = ['tactics', 'endgames', 'openings', 'strategy']
const BANDS: Band[] = ['foundation', 'club', 'strong']

export default function PathPage() {
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? []
  const attempts = useLiveQuery(() => db.puzzleAttempts.orderBy('ts').reverse().limit(500).toArray(), []) ?? []
  const states = nodeStates(CURRICULUM, progress, attempts)
  const mastered = CURRICULUM.filter((n) => states[n.id].state === 'mastered').length
  const pct = Math.round((mastered / CURRICULUM.length) * 100)

  return (
    <div className="stack">
      <PageHead eyebrow="Learning path" title="Your path" actions={<span className="pill accent mono">{mastered}/{CURRICULUM.length} mastered</span>} />
      <div className="card stack tight">
        <div className="row between"><strong>Overall</strong><span className="mono muted">{pct}%</span></div>
        <div className="progress"><span style={{ width: `${pct}%` }} /></div>
        <p className="muted" style={{ fontSize: 14 }}>Lessons teach the idea, drills prove it. Nodes unlock when their prerequisites are mastered; themed drills are judged on your last puzzles of that motif.</p>
      </div>
      {TRACKS.map((track) => {
        const inTrack = CURRICULUM.filter((n) => n.track === track)
        const done = inTrack.filter((n) => states[n.id].state === 'mastered').length
        return (
          <section key={track} className="card" aria-labelledby={`track-${track}`}>
            <div className="card-head"><h2 id={`track-${track}`}>{TRACK_LABEL[track]}</h2><span className="mono muted">{done}/{inTrack.length}</span></div>
            <div className="stack">
              {BANDS.map((band) => {
                const nodes = inTrack.filter((n) => n.band === band)
                if (!nodes.length) return null
                return (
                  <div key={band} className="stack tight">
                    <div className="eyebrow">{BAND_LABEL[band]}</div>
                    <ul className="list">
                      {nodes.map((n) => {
                        const s = states[n.id]
                        const inner = (
                          <>
                            <span className="mark"><Icon name={s.state === 'mastered' ? 'check' : s.state === 'locked' ? 'lock' : ICON[n.kind]} size={20} strokeWidth={s.state === 'mastered' ? 2.4 : 1.8} /></span>
                            <span className="body">
                              <span className="title">{n.title}</span>
                              <span className="desc">{s.state === 'locked' ? s.detail : n.blurb}{s.state !== 'locked' && s.detail ? ` · ${s.detail}` : ''}</span>
                            </span>
                            <span className="end"><span className={`pill mono${s.state === 'mastered' ? ' accent' : ''}`}>{s.state === 'mastered' ? 'Done' : `+${n.xp} XP`}</span></span>
                          </>
                        )
                        return (
                          <li key={n.id}>
                            {s.state === 'locked'
                              ? <div className="node locked" aria-disabled="true">{inner}</div>
                              : <Link to={routeFor(n)} className={`node ${s.state}`}>{inner}</Link>}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
