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
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead><tr><th>Perf</th><th className="num">Rating</th><th className="num">±RD</th><th className="num">Games</th><th>Trend</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.perf}>
              <td style={{ textTransform: 'capitalize' }}>{r.perf}{r.prov && <span className="muted"> (prov.)</span>}</td>
              <td className="num"><strong>{r.rating}</strong></td>
              <td className="num muted">{r.rd ?? '—'}</td>
              <td className="num muted">{r.games ?? '—'}</td>
              <td style={{ width: 110 }}>{seriesFor(r.platform, r.perf).length > 1 ? <Sparkline values={seriesFor(r.platform, r.perf)} height={28} /> : <span className="muted" style={{ fontSize: 12 }}>{r.prog != null ? `${r.prog >= 0 ? '+' : ''}${r.prog} last 12` : 'collecting…'}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow">Rating reflection</div><h1>Progress</h1></div>
        <span className="pill accent">Band: {band.name}</span>
      </div>

      <div className="grid cols-3">
        <div className="card">
          <div className="eyebrow">Internal tactics rating</div>
          <div className="stat" style={{ marginTop: 6 }}><span className="v">{Math.round(tactics.rating)}</span><span className="l">± {Math.round(tactics.rd)} · Glicko-2 over {attempts.length} puzzles{acc != null && ` · ${acc}% accuracy`}</span></div>
          <Sparkline values={ratingSeries.length > 1 ? ratingSeries : [1500, tactics.rating]} />
        </div>
        <div className="card">
          <div className="eyebrow">Experience</div>
          <div className="stat" style={{ marginTop: 6 }}><span className="v">Lv {lvl.level} <span style={{ fontSize: 18 }}>{lvl.title}</span></span><span className="l">{xp} XP · {lvl.next - xp} to next level</span></div>
          <div className="progress" style={{ marginTop: 10 }}><span style={{ width: `${Math.round(lvl.progress * 100)}%` }} /></div>
        </div>
        <div className="card">
          <div className="eyebrow">Consistency</div>
          <div className="stat" style={{ marginTop: 6 }}><span className="v">{streak}🔥</span><span className="l">day streak · 7/30/100-day milestones pay bonus XP</span></div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Lichess</h3>
          {liInput == null ? <button className="btn sm" onClick={() => setLiInput(settings.lichessUser)}>{settings.lichessUser ? `@${settings.lichessUser} · change` : 'Connect username'}</button> : (
            <form className="row" onSubmit={(e) => { e.preventDefault(); void update({ lichessUser: liInput.trim() }); setLiInput(null) }}>
              <input className="input" style={{ width: 180 }} value={liInput} onChange={(e) => setLiInput(e.target.value)} placeholder="Lichess username" autoFocus />
              <button className="btn sm primary" type="submit">Save</button>
            </form>
          )}
        </div>
        {!settings.lichessUser && <p className="muted" style={{ marginTop: 8 }}>Read-only public profile — no login needed.</p>}
        {li.isLoading && <p className="muted">Loading…</p>}
        {li.error && <p style={{ color: 'var(--bad)' }}>Could not reach Lichess ({(li.error as Error).message}). Showing last snapshot below.</p>}
        {li.data?.notFound && <p style={{ color: 'var(--bad)' }}>No Lichess user "{settings.lichessUser}".</p>}
        {li.data && !li.data.notFound && <><PerfTable rows={li.data.rows} /><p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{li.data.games.toLocaleString()} games played.</p></>}
        {li.error && <PerfTable rows={history.filter((h) => h.platform === 'lichess').reduce<PerfRow[]>((acc, h) => { const i = acc.findIndex((r) => r.perf === h.perf); const row = { platform: 'lichess' as const, perf: h.perf, rating: h.rating, rd: h.rd, games: h.games }; if (i < 0) acc.push(row); else acc[i] = row; return acc }, [])} />}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Chess.com</h3>
          {ccInput == null ? <button className="btn sm" onClick={() => setCcInput(settings.chesscomUser)}>{settings.chesscomUser ? `@${settings.chesscomUser} · change` : 'Connect username'}</button> : (
            <form className="row" onSubmit={(e) => { e.preventDefault(); void update({ chesscomUser: ccInput.trim() }); setCcInput(null) }}>
              <input className="input" style={{ width: 180 }} value={ccInput} onChange={(e) => setCcInput(e.target.value)} placeholder="Chess.com username" autoFocus />
              <button className="btn sm primary" type="submit">Save</button>
            </form>
          )}
        </div>
        {cc.isLoading && <p className="muted">Loading…</p>}
        {cc.error && <p style={{ color: 'var(--bad)' }}>Could not reach Chess.com ({(cc.error as Error).message}).</p>}
        {cc.data?.notFound && <p style={{ color: 'var(--bad)' }}>No Chess.com user "{settings.chesscomUser}".</p>}
        {cc.data && !cc.data.notFound && (cc.data.rows.length ? <PerfTable rows={cc.data.rows} /> : <p className="muted" style={{ marginTop: 8 }}>No rated games on this account yet.</p>)}
      </div>

      <Link to="/badges" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Badges</h3><span className="pill accent mono">{earnedCount}/{badges.length}</span>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          {recentBadges.length ? recentBadges.map((b) => <span key={b.def.id} className="pill good">{b.def.icon} {b.def.title}</span>) : <span className="muted">Solve, review and keep your streak to earn badges.</span>}
        </div>
      </Link>

      <div className="card">
        <h3>What this says</h3>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li><strong>{band.name} band.</strong> {band.note}</li>
          {puzzleGap != null && puzzleGap > 150 && <li>Your Lichess puzzle rating is <strong>{puzzleGap} above</strong> your rapid rating: calculation is not the bottleneck — work on <Link to="/path">planning, openings and endgame technique</Link>.</li>}
          {puzzleGap != null && puzzleGap < -100 && <li>Your rapid rating outruns your puzzle rating: more <Link to="/puzzles">daily tactics</Link> will pay off fastest.</li>}
          {byTheme.length > 0 && byTheme[0].pct != null && byTheme[0].pct < 70 && <li>Weakest motif so far: <Link to={`/puzzles/${byTheme[0].key}`}>{byTheme[0].label}</Link> ({byTheme[0].pct}% over {byTheme[0].n}). Make it this week's theme.</li>}
          {attempts.length < 15 && <li>Solve <Link to="/puzzles">15 rated puzzles</Link> to calibrate your internal rating (RD shrinks as you solve).</li>}
        </ul>
      </div>

      {byTheme.length > 0 && (
        <div className="card">
          <h3>Accuracy by motif</h3>
          <div className="heat" style={{ marginTop: 10 }}>
            {byTheme.map((t) => (
              <Link key={t.key} to={`/puzzles/${t.key}`} className="cell" style={{ textDecoration: 'none', color: 'inherit', background: `color-mix(in srgb, ${t.pct! >= 80 ? 'var(--good)' : t.pct! >= 60 ? 'var(--warn)' : 'var(--bad)'} ${Math.min(35, 10 + t.n)}%, var(--surface-2))` }}>
                <span>{t.label}</span><span className="mono">{t.pct}% <span className="muted">/{t.n}</span></span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
