import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery } from '@tanstack/react-query'
import { Chess } from 'chess.js'
import { db, DAY_KEY } from '@/shared/db/db'
import { DAILY_GOAL } from '@/config/scoring'
import { levelForXp } from '@/config/levels'
import { MOTIF_LABEL } from '@/config/themes'
import { todayProgress } from '@/shared/db/xp'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { useSettings } from '@/shared/hooks/useSettings'
import { useDueCards, useStreak, useTotalXp, useUnreviewedGames } from '@/shared/hooks/useCounts'
import { useLichessRatings } from '@/features/progress/useExternalRatings'
import { nextRecommended, type Recommendation } from '@/features/path/progression'
import { CURRICULUM, TRACK_LABEL, BAND_LABEL } from '@/features/path/curriculum'
import { loadPack } from '@/features/puzzles/puzzleSource'
import { uciToMove } from '@/shared/chess/puzzle'
import { useBadges } from '@/shared/hooks/useBadges'
import { Board } from '@/shared/ui/Board'
import { Icon } from '@/shared/ui/Icon'
import { Sparkline } from '@/shared/ui/Sparkline'

const WEEK = 7 * 864e5

function relTime(ts: number) {
  const m = Math.max(1, Math.round((ts - Date.now()) / 60000))
  if (m < 60) return `in ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `in ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'tomorrow' : `in ${d} days`
}

function Delta({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  if (value == null) return null
  return <span className={`delta ${value > 0 ? 'up' : value < 0 ? 'down' : 'flat'}`}>{value > 0 ? '+' : value < 0 ? '−' : '±'}{Math.abs(value)}{suffix}</span>
}

/** Same puzzle all day: a stable pick from the offline pack near the player's rating band. */
function useDailyPuzzle(rating: number) {
  const band = Math.round(rating / 100) * 100
  const day = DAY_KEY()
  return useQuery({
    queryKey: ['daily-puzzle', day, band],
    staleTime: Infinity,
    queryFn: async () => {
      const pack = await loadPack()
      if (!pack.length) return null
      const near = pack.filter((p) => Math.abs(p.rating - band) <= 200)
      const pool = (near.length ? near : pack).slice().sort((a, b) => a.id.localeCompare(b.id))
      let h = 0
      for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0
      const p = pool[h % pool.length]
      const c = new Chess(p.fen)
      try { c.move(uciToMove(p.opponentMove)) } catch { /* keep the setup position */ }
      return { puzzle: p, fen: c.fen() }
    },
  })
}

export default function HomePage() {
  const [settings, , settingsReady] = useSettings()
  const [weekAgo] = useState(() => Date.now() - WEEK)
  const tactics = usePlayerRating('tactics')
  const li = useLichessRatings(settings.lichessUser)
  const today = useLiveQuery(() => todayProgress(), []) ?? { puzzles: 0, lessonsOrDrills: 0, goalHit: false }
  const xp = useTotalXp()
  const streak = useStreak()
  const due = useDueCards()
  const unreviewed = useUnreviewedGames()
  const progress = useLiveQuery(() => db.progress.toArray(), []) ?? []
  const attempts = useLiveQuery(() => db.puzzleAttempts.orderBy('ts').reverse().limit(100).toArray(), []) ?? []
  const baseline = useLiveQuery(async () => (await db.puzzleAttempts.where('ts').below(Date.now() - WEEK).last())?.ratingAfter ?? null, [])
  const rapidSnaps = useLiveQuery(() => db.externalRatings.where('[platform+perf]').equals(['lichess', 'rapid']).sortBy('ts'), []) ?? []
  const latestGame = useLiveQuery(() => db.games.orderBy('playedAt').last(), [])
  const nextDue = useLiveQuery(async () => (await db.srsCards.where('due').above(Date.now()).first())?.due ?? null, [])
  const cardsToday = useLiveQuery(() => db.xpEvents.where('day').equals(DAY_KEY()).filter((e) => e.type === 'opening_card').count(), []) ?? 0
  const daily = useDailyPuzzle(tactics.rating)
  const dailyDone = useLiveQuery(async () => (daily.data ? (await db.puzzleAttempts.where('puzzleId').equals(daily.data.puzzle.id).count()) > 0 : false), [daily.data?.puzzle.id])
  const lvl = levelForXp(xp)
  useBadges()
  const rec = nextRecommended({ progress, attempts, dueCards: due, nodes: CURRICULUM, reviewBacklog: unreviewed })
  if (settingsReady && !settings.onboarded) return <Navigate to="/welcome" replace />

  const puzzlesDone = Math.min(today.puzzles, DAILY_GOAL.puzzles)
  const lessonsDone = Math.min(today.lessonsOrDrills, DAILY_GOAL.lessonsOrDrills)
  const pct = Math.min(100, Math.round(((puzzlesDone / DAILY_GOAL.puzzles) * 0.7 + (lessonsDone / DAILY_GOAL.lessonsOrDrills) * 0.3) * 100))
  const puzzlesLeft = DAILY_GOAL.puzzles - puzzlesDone
  const lessonsLeft = DAILY_GOAL.lessonsOrDrills - lessonsDone
  const minutesLeft = Math.ceil(puzzlesLeft * 1.5 + lessonsLeft * 8)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const ratingSeries = [...attempts].reverse().filter((a) => a.hints === 0).map((a) => a.ratingAfter).slice(-30)
  const tacticsDelta = attempts.length && attempts[0].ts > weekAgo ? Math.round(tactics.rating - (baseline ?? 1500)) : null
  const rapidLive = li.data?.rows.find((r) => r.perf === 'rapid')?.rating
  const rapid = rapidLive ?? rapidSnaps.at(-1)?.rating
  const rapidBase = [...rapidSnaps].reverse().find((s) => s.ts < weekAgo) ?? rapidSnaps[0]
  const rapidDelta = rapid != null && rapidBase && rapidSnaps.length > 1 ? rapid - rapidBase.rating : null

  const byMotif = new Map<string, { n: number; ok: number }>()
  for (const a of attempts) for (const t of a.themes) { if (!MOTIF_LABEL[t]) continue; const s = byMotif.get(t) ?? { n: 0, ok: 0 }; s.n++; if (a.solved) s.ok++; byMotif.set(t, s) }
  const weak = [...byMotif.entries()].filter(([, s]) => s.n >= 3).map(([t, s]) => ({ t, pct: Math.round((s.ok / s.n) * 100), n: s.n })).sort((a, b) => a.pct - b.pct).slice(0, 4)

  const gameLine = (() => {
    const g = latestGame
    if (!g) return null
    const won = (g.result === '1-0' && g.userColor === 'w') || (g.result === '0-1' && g.userColor === 'b')
    const lost = (g.result === '1-0' && g.userColor === 'b') || (g.result === '0-1' && g.userColor === 'w')
    const opp = g.userColor === 'w' ? g.black : g.white
    return `${won ? 'Won vs' : lost ? 'Lost to' : 'Drew with'} ${opp}${g.opening ? ` · ${g.opening}` : ''}`
  })()

  const continueTo = puzzlesLeft > 0 ? '/puzzles' : lessonsLeft > 0 ? (rec.find((r) => CURRICULUM.some((n) => n.id === r.id))?.route ?? '/path') : '/puzzles'
  const continueLabel = puzzlesLeft > 0 ? `Continue · ${puzzlesLeft} puzzle${puzzlesLeft > 1 ? 's' : ''} left` : lessonsLeft > 0 ? 'Continue · one lesson left' : 'Keep training'

  const checklist: { label: string; done: number; of: number; struck?: boolean }[] = [
    { label: `Solve ${DAILY_GOAL.puzzles} rated puzzles`, done: puzzlesDone, of: DAILY_GOAL.puzzles },
    { label: 'One lesson or themed drill', done: lessonsDone, of: DAILY_GOAL.lessonsOrDrills },
    due > 0
      ? { label: `Review ${due} repertoire card${due > 1 ? 's' : ''}`, done: cardsToday, of: cardsToday + due }
      : { label: cardsToday ? 'Repertoire cards reviewed' : 'No repertoire cards due', done: cardsToday, of: cardsToday, struck: true },
  ]

  return (
    <div className="stack home">
      <header className="page-head">
        <div className="titles">
          <div className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>{greet}{settings.lichessUser ? `, ${settings.lichessUser}` : ''}.</h1>
        </div>
        <div className="actions">
          <span className="streak-chip" aria-label={`${streak}-day streak`}><Icon name="flame" size={18} /><span className="desk-only">{streak}-day streak</span><span className="mob-only mono">{streak}</span></span>
          <Link to="/puzzles" className="btn primary desk-only">Start today's session <Icon name="arrow-right" size={18} /></Link>
        </div>
      </header>

      {/* Phone: dark summary card */}
      <section className="today-dark mob-only" aria-label="Today">
        <div className="row nowrap" style={{ gap: 14 }}>
          <div className="ring" style={{ ['--p' as string]: pct, '--size': '76px', '--hole': '60px', '--fill': 'var(--side-accent)', '--track': 'color-mix(in srgb, var(--side-ink) 14%, transparent)', '--hole-bg': 'var(--side-bg)' } as React.CSSProperties}><div><span className="rv mono" style={{ fontSize: 18 }}>{pct}%</span></div></div>
          <div className="grow">
            <div className="eyebrow" style={{ color: 'var(--side-muted)' }}>Today</div>
            <p style={{ fontWeight: 600 }}>{puzzlesDone} of {DAILY_GOAL.puzzles} puzzles · {lessonsDone} of {DAILY_GOAL.lessonsOrDrills} lesson</p>
            <p className="mono" style={{ fontSize: 13, color: 'var(--side-muted)' }}>Lv {lvl.level} {lvl.title} · {xp.toLocaleString()} XP</p>
          </div>
        </div>
        <Link to={continueTo} className="btn block today-cta">{continueLabel} <Icon name="arrow-right" size={18} /></Link>
      </section>

      <div className="split">
        {/* Desktop: today's session */}
        <section className="card main session-card desk-only" aria-labelledby="session-h">
          <div className="ring" style={{ ['--p' as string]: pct, '--size': '132px', '--hole': '108px' } as React.CSSProperties}>
            <div><span className="rv" style={{ fontSize: 32 }}>{pct}%</span><span className="rl">of today</span></div>
          </div>
          <div className="grow">
            <h2 id="session-h">Today's session</h2>
            <p className="muted">{minutesLeft > 0 ? `About ${minutesLeft} minutes left to hit your daily goal.` : 'Daily goal hit. Anything more is a bonus.'}</p>
            <ul className="checklist">
              {checklist.map((c) => {
                const state = c.struck || (c.of > 0 && c.done >= c.of) ? 'done' : c.done > 0 ? 'partial' : 'empty'
                return (
                  <li key={c.label} className={state}>
                    <span className="check-dot">{state === 'done' && <Icon name="check" size={14} strokeWidth={2.6} />}</span>
                    <span className={`grow${c.struck ? ' struck' : ''}`}>{c.label}</span>
                    {!c.struck && <span className="mono muted">{c.done} / {c.of}</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <Link to={daily.data ? `/puzzles?puzzle=${encodeURIComponent(daily.data.puzzle.id)}` : '/puzzles'} className="card side daily-card" aria-label="Daily puzzle: solve it">
          <div className="mini-board daily-board">
            {daily.data ? <Board fen={daily.data.fen} orientation={daily.data.puzzle.sideToMove === 'w' ? 'white' : 'black'} interactive={false} coordinates={false} animationMs={0} id="daily" /> : <div className="mini-placeholder" />}
          </div>
          <div className="daily-text">
            <div className="eyebrow">Daily puzzle</div>
            <h3>{daily.data ? `${daily.data.puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move and ${daily.data.puzzle.themes.some((t) => t.startsWith('mate')) ? 'mate' : 'win'}` : 'Loading today’s position…'}</h3>
            {daily.data && <p className="muted mono" style={{ fontSize: 13 }}>Rated {daily.data.puzzle.rating}{dailyDone ? ' · attempted' : ''}</p>}
            <span className="btn secondary sm desk-only" aria-hidden="true">Solve it</span>
          </div>
          <Icon name="chevron-right" className="mob-only muted" />
        </Link>
      </div>

      <div className="stat-grid">
        <Link to="/puzzles" className="card stat-tile">
          <div className="eyebrow">Tactics rating</div>
          <div className="stat-line"><span className="v num">{Math.round(tactics.rating)}</span><Delta value={tacticsDelta} /></div>
          <Sparkline values={ratingSeries} height={40} />
        </Link>
        <Link to="/progress" className="card stat-tile">
          <div className="eyebrow">Lichess rapid</div>
          <div className="stat-line"><span className="v num">{rapid ?? '—'}</span><Delta value={rapidDelta} /></div>
          {rapidSnaps.length > 1 ? <Sparkline values={rapidSnaps.map((s) => s.rating).slice(-30)} height={40} /> : <p className="muted tile-note">{settings.lichessUser ? 'Trend builds from daily snapshots' : 'Connect your username'}</p>}
        </Link>
        <Link to="/review" className="card stat-tile">
          <div className="eyebrow"><span className="desk-only">Games to review</span><span className="mob-only">To review</span></div>
          <div className="stat-line"><span className="v num">{unreviewed}</span></div>
          <p className="muted tile-note">{gameLine ?? 'Import games or paste a PGN'}</p>
          <span className="arrow-link desk-only">Review now <Icon name="arrow-right" size={16} /></span>
        </Link>
        <Link to="/openings" className="card stat-tile desk-only">
          <div className="eyebrow">Repertoire cards</div>
          <div className="stat-line"><span className="v num">{due}</span><span className="muted" style={{ fontSize: 14 }}>due</span></div>
          <p className="muted tile-note">{nextDue ? `Next ones due ${relTime(nextDue)}` : due ? 'Due now' : 'Drill a repertoire to start'}</p>
          <span className="arrow-link">Browse repertoires <Icon name="arrow-right" size={16} /></span>
        </Link>
        <Link to={weak[0] ? `/puzzles/${weak[0].t}` : '/puzzles'} className="card stat-tile mob-only">
          <div className="eyebrow">Weak spot</div>
          <div className="stat-line"><span className="v num">{weak[0] ? `${weak[0].pct}%` : '—'}</span></div>
          <p className="muted tile-note">{weak[0] ? MOTIF_LABEL[weak[0].t] : 'Solve more to find it'}</p>
        </Link>
      </div>

      <div className="split">
        <section className="card main" aria-labelledby="path-h">
          <div className="card-head">
            <h2 id="path-h"><span className="desk-only">Continue your path</span><span className="mob-only">Up next on your path</span></h2>
            <Link to="/path" className="arrow-link">Full path <Icon name="arrow-right" size={16} /></Link>
          </div>
          <ul className="list path-recs">
            {rec.slice(0, 3).map((r, i) => <RecRow key={r.id} r={r} first={i === 0} />)}
          </ul>
        </section>

        <section className="card side desk-only" aria-labelledby="weak-h">
          <div className="card-head"><h2 id="weak-h">Weak spots</h2><span className="eyebrow">Last 100</span></div>
          {weak.length ? (
            <>
              <div className="stack" style={{ gap: 14 }}>
                {weak.map((w) => (
                  <div key={w.t} className="bar-row">
                    <span>{MOTIF_LABEL[w.t]}</span><span className="mono muted">{w.pct}%</span>
                    <div className="progress"><span style={{ width: `${w.pct}%`, background: w.pct < 55 ? 'var(--warn)' : w.pct < 70 ? 'color-mix(in srgb, var(--accent) 55%, var(--surface-2))' : 'var(--accent)' }} /></div>
                  </div>
                ))}
              </div>
              <Link to={`/puzzles/${weak[0].t}`} className="btn secondary block" style={{ marginTop: 18 }}>Drill {MOTIF_LABEL[weak[0].t].toLowerCase()}</Link>
            </>
          ) : <p className="muted">Solve a few rated puzzles and your weakest motifs show up here.</p>}
        </section>
      </div>
    </div>
  )
}

function RecRow({ r, first }: { r: Recommendation; first: boolean }) {
  const node = CURRICULUM.find((n) => n.id === r.id)
  const where = node ? `${TRACK_LABEL[node.track]} · ${BAND_LABEL[node.band].split(' · ')[0]}` : r.id === 'srs' ? 'Openings · Spaced repetition' : r.id === 'weak' ? 'Tactics · Weak spot' : 'Games · Review'
  return (
    <li>
      <Link to={r.route} className={`node${first ? ' highlight' : ''}`}>
        <span className="mark"><Icon name={r.icon} size={22} /></span>
        <span className="body">
          {first && <span className="eyebrow">Up next · {where}</span>}
          <span className="title">{r.title}</span>
          <span className="desc">{r.reason}</span>
        </span>
        <span className="end"><span className="pill accent mono">+{r.xp} XP</span></span>
      </Link>
    </li>
  )
}
