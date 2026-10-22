import { Link } from 'react-router-dom'
import { useBadges } from '@/shared/hooks/useBadges'
import type { BadgeDef } from '@/config/badges'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

const GROUPS: { key: BadgeDef['group']; label: string }[] = [
  { key: 'tactics', label: 'Tactics' }, { key: 'motif', label: 'Motif mastery' }, { key: 'consistency', label: 'Consistency' },
  { key: 'path', label: 'Learning path' }, { key: 'review', label: 'Game review' }, { key: 'openings', label: 'Openings' }, { key: 'level', label: 'Levels' },
]

export default function BadgesPage() {
  const { badges, earnedCount } = useBadges()
  return (
    <div className="stack">
      <PageHead eyebrow={<span className="crumbs"><Link to="/progress">Progress</Link><span aria-hidden="true">/</span><span>Achievements</span></span>} title="Badges" actions={<span className="pill accent mono">{earnedCount}/{badges.length}</span>} />
      {GROUPS.map((g) => {
        const list = badges.filter((b) => b.def.group === g.key)
        if (!list.length) return null
        return (
          <section key={g.key} className="stack tight" aria-label={g.label}>
            <div className="eyebrow">{g.label}</div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {list.map((b) => (
                <div key={b.def.id} className={`card badge-card${b.earned ? ' earned' : ''}`}>
                  <div className="row nowrap" style={{ gap: 12 }}>
                    <span className="badge-ico"><Icon name={b.def.icon} size={22} /></span>
                    <strong className="grow">{b.def.title}</strong>
                    {b.earned && <span className="pill good" aria-label="Earned"><Icon name="check" size={14} strokeWidth={2.6} /></span>}
                  </div>
                  <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{b.def.desc}</p>
                  {!b.earned && <><div className="progress thin" style={{ marginTop: 10 }}><span style={{ width: `${Math.round((b.progress / b.target) * 100)}%` }} /></div><p className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>{b.progress}/{b.target}</p></>}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
