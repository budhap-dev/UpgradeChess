import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/db'
import { useSettings } from '@/shared/hooks/useSettings'
import { importRecent, fromPgn } from './importGames'
import { useToast } from '@/shared/ui/toastStore'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

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
      <PageHead
        eyebrow="Game review"
        title="Your games"
        sub="Review every loss: analyse locally with Stockfish, guess the better move at each mistake, then log what kind of error it was. The most frequent category becomes your weekly theme."
        actions={<>
          <button className="btn" onClick={() => setPgnOpen((v) => !v)} aria-expanded={pgnOpen}><Icon name="plus" size={18} />Paste PGN</button>
          <button className="btn primary" disabled={busy} onClick={doImport}><Icon name="download" size={18} />{busy ? 'Importing…' : 'Import recent games'}</button>
        </>}
      />
      {pgnOpen && (
        <div className="card stack">
          <label className="field">PGN<textarea className="input" rows={6} value={pgn} onChange={(e) => setPgn(e.target.value)} placeholder="[Event …]\n1. e4 e5 2. Nf3 …" /></label>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <label className="field">I played <select className="input" style={{ width: 140 }} value={pgnColor} onChange={(e) => setPgnColor(e.target.value as 'w' | 'b')}><option value="w">White</option><option value="b">Black</option></select></label>
            <button className="btn primary" onClick={addPgn}>Add game</button>
          </div>
        </div>
      )}
      {reviewedCount > 0 && top && (
        <div className="card">
          <div className="card-head"><h2>Error profile</h2><span className="mono muted">{reviewedCount} reviewed</span></div>
          <div className="row" style={{ gap: 6 }}>{Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, n]) => <span key={c} className={`pill ${c === top[0] ? 'warn' : ''}`}>{CAT_LABEL[c as keyof typeof CAT_LABEL]} · {n}</span>)}</div>
          <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>Most frequent: <strong>{CAT_LABEL[top[0] as keyof typeof CAT_LABEL]}</strong>. {top[0] === 'tactic' ? <>Make this week's theme <Link to="/puzzles">rated puzzles</Link>.</> : top[0] === 'opening' ? <>Drill your <Link to="/openings">repertoire</Link> and the opening lessons.</> : top[0] === 'endgame' ? <>Work through the <Link to="/path">endgame track</Link>.</> : <>Study the <Link to="/path">strategy lessons</Link> and annotate your plans.</>}</p>
        </div>
      )}
      {games.length === 0 && <div className="card empty-state"><Icon name="search" size={28} className="muted" /><p style={{ marginTop: 8 }}>No games yet. Import from Lichess / Chess.com (usernames in Settings) or paste a PGN.</p></div>}
      <ul className="list">
        {games.map((g) => {
          const won = (g.result === '1-0' && g.userColor === 'w') || (g.result === '0-1' && g.userColor === 'b')
          const lost = (g.result === '1-0' && g.userColor === 'b') || (g.result === '0-1' && g.userColor === 'w')
          const opp = g.userColor === 'w' ? g.black : g.white
          const oppR = g.userColor === 'w' ? g.blackRating : g.whiteRating
          return (
            <li key={g.id}>
              <Link to={`/review/${encodeURIComponent(g.id)}`} className={`node ${g.reviewed ? 'mastered' : 'available'}`}>
                <span className={`mark ${won ? 'win' : lost ? 'loss' : ''}`} aria-label={won ? 'Win' : lost ? 'Loss' : 'Draw'}>{won ? 'W' : lost ? 'L' : 'D'}</span>
                <span className="body">
                  <span className="title row nowrap" style={{ gap: 8 }}><span className={`side-swatch ${g.userColor}`} aria-label={g.userColor === 'w' ? 'You played White' : 'You played Black'} />vs {opp}{oppR ? ` (${oppR})` : ''}</span>
                  <span className="desc">{new Date(g.playedAt).toLocaleDateString()} · {g.speed} · {g.source}{g.opening ? ` · ${g.opening}` : ''}</span>
                </span>
                <span className="end">{g.summary ? <><span className="pill bad mono">{g.summary.blunders}??</span><span className="pill warn mono">{g.summary.mistakes}?</span>{g.reviewed && <span className="pill good"><Icon name="check" size={14} strokeWidth={2.4} />reviewed</span>}</> : <span className="pill">analyse</span>}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
