import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/db'
import { DAILY_GOAL } from '@/config/scoring'
import { levelForXp } from '@/config/levels'
import { activeDays, computeStreak, todayProgress, totalXp } from '@/shared/db/xp'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useSettings } from '@/shared/hooks/useSettings'
import { useLichessRatings } from '@/features/progress/useExternalRatings'
import { nextRecommended } from '@/features/path/progression'
import { CURRICULUM } from '@/features/path/curriculum'
import { useBadges } from '@/shared/hooks/useBadges'

export default function HomePage() {
  const [settings] = useSettings()
  const tactics = usePlayerRating('tactics')
  const li = useLichessRatings(settings.lichessUser)
  const today = useLiveQuery(() => todayProgress(), []) ?? { puzzles: 0, lessonsOrDrills: 0, goalHit: false }
  const xp = useLiveQuery(() => totalXp(), []) ?? 0
  const streak = useLiveQuery(async () => computeStreak(await activeDays()), []) ?? 0
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? []
  const attempts = useLiveQuery(() => db.puzzleAttempts.orderBy('ts').reverse().limit(100).toArray(), []) ?? []
  const due = useLiveQuery(() => db.srsCards.where('due').belowOrEqual(Date.now()).count(), []) ?? 0
  const unreviewed = useLiveQuery(() => db.games.filter((g) => !g.reviewed).count(), []) ?? 0
  const lvl = levelForXp(xp)
  useBadges()
  const rec = nextRecommended({ progress, attempts, dueCards: due, nodes: CURRICULUM, reviewBacklog: unreviewed })
  const pct = Math.min(100, Math.round(((Math.min(today.puzzles, DAILY_GOAL.puzzles) / DAILY_GOAL.puzzles) * 0.7 + (Math.min(today.lessonsOrDrills, DAILY_GOAL.lessonsOrDrills) / DAILY_GOAL.lessonsOrDrills) * 0.3) * 100))
  const rapid = li.data?.rows.find((r) => r.perf === 'rapid')?.rating
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>{greet}{settings.lichessUser ? `, ${settings.lichessUser}` : ''}.</h1></div>
        {!settings.onboarded && <Link to="/settings" className="btn sm">Set up profile →</Link>}
      </div>

      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="ring" style={{ ['--p' as string]: pct }}><div>{pct}%</div></div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3>Today's goal</h3>
          <p className="muted">{today.puzzles}/{DAILY_GOAL.puzzles} puzzles · {today.lessonsOrDrills}/{DAILY_GOAL.lessonsOrDrills} lesson or drill {today.goalHit && <span className="pill good">done ✓</span>}</p>
          <div className="row" style={{ marginTop: 8 }}>
            <span className="pill">🔥 {streak}-day streak</span>
            <span className="pill accent">Lv {lvl.level} {lvl.title} · {xp} XP</span>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <Link to="/puzzles" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><div className="eyebrow">Puzzles</div><div className="stat"><span className="v">{Math.round(tactics.rating)}</span><span className="l">tactics rating · solve rated</span></div></Link>
        <Link to="/progress" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><div className="eyebrow">Lichess rapid</div><div className="stat"><span className="v">{rapid ?? '—'}</span><span className="l">{settings.lichessUser ? 'live from lichess.org' : 'connect username'}</span></div></Link>
        <Link to="/review" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><div className="eyebrow">Review</div><div className="stat"><span className="v">{unreviewed}</span><span className="l">{unreviewed === 1 ? 'game to review' : 'games to review'} · <span style={{ color: 'var(--accent)' }}>play ♔</span></span></div></Link>
        <Link to="/openings" className="card" style={{ textDecoration: 'none', color: 'inherit' }}><div className="eyebrow">Openings</div><div className="stat"><span className="v">{due}</span><span className="l">repertoire cards due</span></div></Link>
      </div>

      <div className="row">
        <Link to="/play" className="btn">♔ Play vs engine</Link>
        <Link to="/openings" className="btn">♙ Openings</Link>
        <Link to="/tricks" className="btn">⚡ Gambits & tricks</Link>
        <Link to="/library" className="btn">Library</Link>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>Continue your path</h3><Link to="/path" className="btn sm ghost">Full path →</Link></div>
        <ul className="list" style={{ marginTop: 10 }}>
          {rec.slice(0, 3).map((n) => (
            <Link key={n.id} to={n.route} className="node available">
              <span className="mark">{n.icon}</span>
              <span style={{ flex: 1 }}><strong>{n.title}</strong><br /><span className="muted" style={{ fontSize: 14 }}>{n.reason}</span></span>
              <span className="pill accent mono">+{n.xp} XP</span>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  )
}
