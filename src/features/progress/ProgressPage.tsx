import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '@/shared/db/db'
import { useSettings } from '@/shared/hooks/useSettings'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { levelForXp } from '@/config/levels'
import { MOTIFS } from '@/config/themes'
import { Sparkline } from '@/shared/ui/Sparkline'
import { activeDays, computeStreak, totalXp } from '@/shared/db/xp'
import { useLichessRatings, useChesscomRatings, type PerfRow } from './useExternalRatings'
import { useState } from 'react'
import { useBadges } from '@/shared/hooks/useBadges'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

function bandFor(rapid: number | undefined, tactics: number): { name: string; note: string } {
  const r = rapid ?? tactics - 200
  if (r < 1200) return { name: 'Foundation', note: 'Board vision, hanging pieces, one-move tactics, basic mates.' }
  if (r < 1600) return { name: 'Club', note: '2–3 move tactics, simple plans, K+P and rook endings.' }
  if (r < 2000) return { name: 'Strong club', note: 'Calculation depth, prophylaxis, theoretical endings, a real repertoire.' }
  return { name: 'Expert', note: 'Deep prep, positional nuance, complex endings.' }
}

export default function ProgressPage() {
  const [settings, update] = useSettings()
  const tactics = usePlayerRating('tactics')
  const li = useLichessRatings(settings.lichessUser)
  const cc = useChesscomRatings(settings.chesscomUser)
  const [liInput, setLiInput] = useState<string | null>(null)
  const [ccInput, setCcInput] = useState<string | null>(null)

  const xp = useLiveQuery(() => totalXp(), []) ?? 0
  const streak = useLiveQuery(async () => computeStreak(await activeDays()), []) ?? 0
  const attempts = useLiveQuery(() => db.puzzleAttempts.orderBy('ts').reverse().limit(300).toArray(), []) ?? []
  const history = useLiveQuery(() => db.externalRatings.orderBy('ts').toArray(), []) ?? []
  const lvl = levelForXp(xp)
  const { badges, earnedCount } = useBadges()
  const recentBadges = badges.filter((b) => b.earned).slice(-6)

  const ratingSeries = [...attempts].reverse().filter((a) => a.hints === 0).map((a) => a.ratingAfter)
  const solved = attempts.filter((a) => a.solved).length
  const acc = attempts.length ? Math.round((solved / attempts.length) * 100) : null

  const byTheme = MOTIFS.map((m) => {
    const rel = attempts.filter((a) => a.themes.includes(m.key))
    const ok = rel.filter((a) => a.solved).length
    return { ...m, n: rel.length, pct: rel.length ? Math.round((ok / rel.length) * 100) : null }
  }).filter((t) => t.n > 0).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))

  const lichessRapid = li.data?.rows.find((r) => r.perf === 'rapid')?.rating
  const band = bandFor(lichessRapid, tactics.rating)
  const puzzleGap = lichessRapid && li.data?.rows.find((r) => r.perf === 'puzzle') ? li.data.rows.find((r) => r.perf === 'puzzle')!.rating - lichessRapid : null

  const seriesFor = (platform: string, perf: string) => history.filter((h) => h.platform === platform && h.perf === perf).map((h) => h.rating)

  const PerfTable = ({ rows }: { rows: PerfRow[] }) => (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Perf</th><th className="num">Rating</th><th className="num">±RD</th><th className="num">Games</th><th>Trend</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.perf}>
              <td style={{ textTransform: 'capitalize' }}>{r.perf}{r.prov && <span className="muted"> (prov.)</span>}</td>
              <td className="num mono"><strong>{r.rating}</strong></td>
              <td className="num mono muted">{r.rd ?? '—'}</td>
              <td className="num mono muted">{r.games ?? '—'}</td>
              <td style={{ width: 120, whiteSpace: 'nowrap' }}>{seriesFor(r.platform, r.perf).length > 1 ? <Sparkline values={seriesFor(r.platform, r.perf)} height={28} /> : <span className="muted mono" style={{ fontSize: 12 }}>{r.prog != null ? `${r.prog >= 0 ? '+' : ''}${r.prog} last 12` : 'collecting…'}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const userForm = (value: string | null, set: (v: string | null) => void, current: string, field: 'lichessUser' | 'chesscomUser', label: string) =>
    value == null ? <button className="btn sm" onClick={() => set(current)}>{current ? `@${current} · change` : 'Connect username'}</button> : (
      <form className="row" style={{ gap: 6 }} onSubmit={(e) => { e.preventDefault(); void update({ [field]: value.trim() }); set(null) }}>
        <input className="input" style={{ width: 180 }} value={value} onChange={(e) => set(e.target.value)} placeholder={`${label} username`} aria-label={`${label} username`} autoFocus />
        <button className="btn sm primary" type="submit">Save</button>
      </form>
    )

  return (
    <div className="stack">
      <PageHead eyebrow="Rating reflection" title="Progress" actions={<span className="pill accent">Band: {band.name}</span>} />

      <div className="grid cols-3">
        <div className="card stack tight">
          <div className="eyebrow">Internal tactics rating</div>
          <div className="stat"><span className="v">{Math.round(tactics.rating)} <small className="mono">± {Math.round(tactics.rd)}</small></span><span className="l">Glicko-2 over {attempts.length} puzzles{acc != null && ` · ${acc}% accuracy`}</span></div>
          <Sparkline values={ratingSeries.length > 1 ? ratingSeries : [1500, tactics.rating]} />
        </div>
        <div className="card stack tight">
          <div className="eyebrow">Experience</div>
          <div className="stat"><span className="v">Lv {lvl.level} <small>{lvl.title}</small></span><span className="l mono">{xp.toLocaleString()} XP · {(lvl.next - xp).toLocaleString()} to next level</span></div>
          <div className="progress" style={{ marginTop: 'auto' }}><span style={{ width: `${Math.round(lvl.progress * 100)}%` }} /></div>
        </div>
        <div className="card stack tight">
          <div className="eyebrow">Consistency</div>
          <div className="stat"><span className="v row nowrap" style={{ gap: 8 }}>{streak}<Icon name="flame" size={28} className="warn" /></span><span className="l">day streak · 7/30/100-day milestones pay bonus XP</span></div>
        </div>
      </div>

      <section className="card" aria-labelledby="li-h">
        <div className="card-head"><h2 id="li-h">Lichess</h2>{userForm(liInput, setLiInput, settings.lichessUser, 'lichessUser', 'Lichess')}</div>
        {!settings.lichessUser && <p className="muted">Read-only public profile, no login needed.</p>}
        {li.isLoading && <p className="muted">Loading…</p>}
        {li.error && <p className="bad">Could not reach Lichess ({(li.error as Error).message}). Showing last snapshot below.</p>}
        {li.data?.notFound && <p className="bad">No Lichess user "{settings.lichessUser}".</p>}
        {li.data && !li.data.notFound && <><PerfTable rows={li.data.rows} /><p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{li.data.games.toLocaleString()} games played.</p></>}
        {li.error && <PerfTable rows={history.filter((h) => h.platform === 'lichess').reduce<PerfRow[]>((acc, h) => { const i = acc.findIndex((r) => r.perf === h.perf); const row = { platform: 'lichess' as const, perf: h.perf, rating: h.rating, rd: h.rd, games: h.games }; if (i < 0) acc.push(row); else acc[i] = row; return acc }, [])} />}
      </section>

      <section className="card" aria-labelledby="cc-h">
        <div className="card-head"><h2 id="cc-h">Chess.com</h2>{userForm(ccInput, setCcInput, settings.chesscomUser, 'chesscomUser', 'Chess.com')}</div>
        {!settings.chesscomUser && <p className="muted">Optional. Public stats only.</p>}
        {cc.isLoading && <p className="muted">Loading…</p>}
        {cc.error && <p className="bad">Could not reach Chess.com ({(cc.error as Error).message}).</p>}
        {cc.data?.notFound && <p className="bad">No Chess.com user "{settings.chesscomUser}".</p>}
        {cc.data && !cc.data.notFound && (cc.data.rows.length ? <PerfTable rows={cc.data.rows} /> : <p className="muted">No rated games on this account yet.</p>)}
      </section>

      <div className="split">
        <section className="card main" aria-labelledby="says-h">
          <div className="card-head"><h2 id="says-h">What this says</h2></div>
          <ul className="prose" style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>{band.name} band.</strong> {band.note}</li>
            {puzzleGap != null && puzzleGap > 150 && <li>Your Lichess puzzle rating is <strong>{puzzleGap} above</strong> your rapid rating: calculation is not the bottleneck. Work on <Link to="/path">planning, openings and endgame technique</Link>.</li>}
            {puzzleGap != null && puzzleGap < -100 && <li>Your rapid rating outruns your puzzle rating: more <Link to="/puzzles">daily tactics</Link> will pay off fastest.</li>}
            {byTheme.length > 0 && byTheme[0].pct != null && byTheme[0].pct < 70 && <li>Weakest motif so far: <Link to={`/puzzles/${byTheme[0].key}`}>{byTheme[0].label}</Link> ({byTheme[0].pct}% over {byTheme[0].n}). Make it this week's theme.</li>}
            {attempts.length < 15 && <li>Solve <Link to="/puzzles">15 rated puzzles</Link> to calibrate your internal rating (RD shrinks as you solve).</li>}
          </ul>
        </section>
        <Link to="/badges" className="card side stack tight">
          <div className="card-head" style={{ marginBottom: 4 }}><h2>Badges</h2><span className="pill accent mono">{earnedCount}/{badges.length}</span></div>
          <div className="row" style={{ gap: 6 }}>
            {recentBadges.length ? recentBadges.map((b) => <span key={b.def.id} className="pill good"><Icon name={b.def.icon} size={14} />{b.def.title}</span>) : <span className="muted">Solve, review and keep your streak to earn badges.</span>}
          </div>
          <span className="arrow-link" style={{ marginTop: 'auto' }}>All badges <Icon name="arrow-right" size={16} /></span>
        </Link>
      </div>

      {byTheme.length > 0 && (
        <section className="card" aria-labelledby="motif-h">
          <div className="card-head"><h2 id="motif-h">Accuracy by motif</h2><span className="eyebrow">Last 300</span></div>
          <div className="heat">
            {byTheme.map((t) => (
              <Link key={t.key} to={`/puzzles/${t.key}`} className="cell" style={{ background: `color-mix(in srgb, ${t.pct! >= 80 ? 'var(--good)' : t.pct! >= 60 ? 'var(--warn)' : 'var(--bad)'} ${Math.min(30, 8 + t.n)}%, var(--surface-2))` }}>
                <span>{t.label}</span><span className="mono">{t.pct}% <span className="muted">/{t.n}</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
