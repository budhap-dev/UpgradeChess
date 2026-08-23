import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/db'
import { useSettings } from '@/shared/hooks/useSettings'
import { importRecent, fromPgn } from './importGames'
import { useToast } from '@/shared/ui/toastStore'

const CAT_LABEL = { opening: 'Opening', tactic: 'Tactic missed', plan: 'Plan / positional', endgame: 'Endgame technique' } as const

export default function ReviewPage() {
  const [settings] = useSettings()
  const show = useToast((t) => t.show)
  const games = useLiveQuery(() => db.games.orderBy('playedAt').reverse().toArray(), []) ?? []
  const [busy, setBusy] = useState(false)
  const [pgnOpen, setPgnOpen] = useState(false)
  const [pgn, setPgn] = useState('')
  const [pgnColor, setPgnColor] = useState<'w' | 'b'>('w')

  const doImport = async () => {
    if (!settings.lichessUser && !settings.chesscomUser) { show('Connect a username in Settings first'); return }
    setBusy(true)
    const r = await importRecent(settings.lichessUser, settings.chesscomUser, 20)
    setBusy(false)
    show(r.added ? `Imported ${r.added} new game${r.added > 1 ? 's' : ''}` : r.errors[0] ?? 'No new games')
  }
  const addPgn = async () => {
    const g = fromPgn(pgn, pgnColor)
    if (!g) { show('Could not read that PGN'); return }
    await db.games.put(g); setPgn(''); setPgnOpen(false); show('Game added')
  }

  // aggregate error categories across reviewed games
  const cats: Record<string, number> = {}
  let reviewedCount = 0
  for (const g of games) if (g.reviewed && g.errors) { reviewedCount++; for (const e of g.errors) if (e.severity !== 'inaccuracy') cats[e.category] = (cats[e.category] ?? 0) + 1 }
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow">Game review</div><h1>Your games</h1></div>
        <div className="row">
          <button className="btn" onClick={() => setPgnOpen((v) => !v)}>Paste PGN</button>
          <button className="btn primary" disabled={busy} onClick={doImport}>{busy ? 'Importing…' : 'Import recent games'}</button>
        </div>
      </div>
      <p className="muted">Review every loss: analyse locally with Stockfish, guess the better move at each mistake, then log what kind of error it was. The most frequent category becomes your weekly theme.</p>
      {pgnOpen && (
        <div className="card stack">
          <textarea className="input" rows={6} value={pgn} onChange={(e) => setPgn(e.target.value)} placeholder="[Event …]\n1. e4 e5 2. Nf3 …" />
          <div className="row">
            <label className="row">I played <select className="input" style={{ width: 120 }} value={pgnColor} onChange={(e) => setPgnColor(e.target.value as 'w' | 'b')}><option value="w">White</option><option value="b">Black</option></select></label>
            <button className="btn primary" onClick={addPgn}>Add game</button>
          </div>
        </div>
      )}
      {reviewedCount > 0 && top && (
        <div className="card">
          <h3>Error profile · {reviewedCount} reviewed</h3>
          <div className="row" style={{ marginTop: 8 }}>{Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => <span key={c} className={`pill ${c === top[0] ? 'warn' : ''}`}>{CAT_LABEL[c as keyof typeof CAT_LABEL]} · {n}</span>)}</div>
          <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>Most frequent: <strong>{CAT_LABEL[top[0] as keyof typeof CAT_LABEL]}</strong>. {top[0] === 'tactic' ? <>Make this week's theme <Link to="/puzzles">rated puzzles</Link>.</> : top[0] === 'opening' ? <>Drill your <Link to="/openings">repertoire</Link> and the opening lessons.</> : top[0] === 'endgame' ? <>Work through the <Link to="/path">endgame track</Link>.</> : <>Study the <Link to="/path">strategy lessons</Link> and annotate your plans.</>}</p>
        </div>
      )}
      {games.length === 0 && <div className="card"><p>No games yet. Import from Lichess / Chess.com (usernames in Settings) or paste a PGN.</p></div>}
      <ul className="list">
        {games.map((g) => {
          const won = (g.result === '1-0' && g.userColor === 'w') || (g.result === '0-1' && g.userColor === 'b')
          const lost = (g.result === '1-0' && g.userColor === 'b') || (g.result === '0-1' && g.userColor === 'w')
          const opp = g.userColor === 'w' ? g.black : g.white
          const oppR = g.userColor === 'w' ? g.blackRating : g.whiteRating
          return (
            <Link key={g.id} to={`/review/${encodeURIComponent(g.id)}`} className={`node ${g.reviewed ? 'mastered' : 'available'}`}>
              <span className="mark" style={{ background: won ? 'color-mix(in srgb, var(--good) 25%, var(--surface-2))' : lost ? 'color-mix(in srgb, var(--bad) 25%, var(--surface-2))' : undefined }}>{won ? 'W' : lost ? 'L' : 'D'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{g.userColor === 'w' ? '⬜' : '⬛'} vs {opp}{oppR ? ` (${oppR})` : ''}</strong>
                <br /><span className="muted" style={{ fontSize: 14 }}>{new Date(g.playedAt).toLocaleDateString()} · {g.speed} · {g.source}{g.opening ? ` · ${g.opening}` : ''}</span>
              </span>
              {g.summary ? <span className="row" style={{ gap: 6 }}><span className="pill bad mono">{g.summary.blunders}??</span><span className="pill warn mono">{g.summary.mistakes}?</span>{g.reviewed && <span className="pill good">reviewed</span>}</span> : <span className="pill">analyse</span>}
            </Link>
          )
        })}
      </ul>
    </div>
  )
}
