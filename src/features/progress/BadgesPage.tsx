import { Link } from 'react-router-dom'
import { useBadges } from '@/shared/hooks/useBadges'
import type { BadgeDef } from '@/config/badges'

const GROUPS: { key: BadgeDef['group']; label: string }[] = [
  { key: 'tactics', label: 'Tactics' }, { key: 'motif', label: 'Motif mastery' }, { key: 'consistency', label: 'Consistency' },
  { key: 'path', label: 'Learning path' }, { key: 'review', label: 'Game review' }, { key: 'openings', label: 'Openings' }, { key: 'level', label: 'Levels' },
]

export default function BadgesPage() {
  const { badges, earnedCount } = useBadges()
  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow"><Link to="/progress">Progress</Link> · achievements</div><h1>Badges</h1></div>
        <span className="pill accent mono">{earnedCount}/{badges.length}</span>
      </div>
      {GROUPS.map((g) => {
        const list = badges.filter((b) => b.def.group === g.key)
        if (!list.length) return null
        return (
          <section key={g.key}>
            <div className="eyebrow" style={{ margin: '8px 0' }}>{g.label}</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {list.map((b) => (
                <div key={b.def.id} className={`card flat ${b.earned ? '' : ''}`} style={{ opacity: b.earned ? 1 : 0.7, borderColor: b.earned ? 'var(--good)' : undefined }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 22, width: 32, textAlign: 'center', filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.def.icon}</span>
                    <strong style={{ flex: 1 }}>{b.def.title}</strong>
                    {b.earned && <span className="pill good">✓</span>}
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{b.def.desc}</p>
                  {!b.earned && <><div className="progress" style={{ marginTop: 8, height: 6 }}><span style={{ width: `${Math.round((b.progress / b.target) * 100)}%` }} /></div><p className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>{b.progress}/{b.target}</p></>}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
