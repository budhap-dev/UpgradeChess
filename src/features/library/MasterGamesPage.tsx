import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '@/shared/ui/Board'
import { MASTER_GAMES, type MasterGame } from './masterGames'
import { db } from '@/shared/db/db'
import { addXp } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'
import { isCorrectMove } from '@/shared/chess/puzzle'

const GAME_XP = 30
const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const BEST: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--info)' }

export default function MasterGamesPage() {
  const { gameId } = useParams()
  const game = MASTER_GAMES.find((g) => g.id === gameId) ?? null
  const doneRows = useLiveQuery(() => db.progress.filter((p) => p.nodeId.startsWith('master:')).toArray(), []) ?? []
  const done = useMemo(() => new Set(doneRows.map((p) => p.nodeId.slice(7))), [doneRows])
  if (!game) {
    return (
      <div className="stack">
        <div className="page-head"><div><div className="eyebrow"><Link to="/library">Library</Link></div><h1>Annotated master games</h1></div><span className="pill accent mono">{done.size}/{MASTER_GAMES.length} studied</span></div>
        <p className="muted">Step through a classic with notes at the key moments. At the marked moves you play first — <strong>guess the move</strong> the master found. Finish a game for +{GAME_XP} XP.</p>
        <ul className="list">
          {MASTER_GAMES.map((g) => (
            <Link key={g.id} to={`/library/games/${g.id}`} className={`node ${done.has(g.id) ? 'mastered' : 'available'}`}>
              <span className="mark">{done.has(g.id) ? '✓' : '♚'}</span>
              <span style={{ flex: 1, minWidth: 0 }}><strong>{g.title}</strong> <span className="muted">· {g.white} – {g.black}, {g.event} {g.year}</span><br /><span className="muted" style={{ fontSize: 14 }}>{g.theme}</span></span>
              <span className="pill mono">{g.guess.length} guesses</span>
            </Link>
          ))}
        </ul>
      </div>
    )
  }
  return <GameStudy game={game} done={done.has(game.id)} />
}

function GameStudy({ game, done }: { game: MasterGame; done: boolean }) {
  const show = useToast((t) => t.show)
  const sans = useMemo(() => game.moves.split(' '), [game.moves])
  const fens = useMemo(() => { const c = new Chess(); const out = [c.fen()]; for (const s of sans) { c.move(s); out.push(c.fen()) } return out }, [sans])
  const [ply, setPly] = useState(0)
  const [guessing, setGuessing] = useState<null | 'ask' | 'wrong'>(null)
  const [mark, setMark] = useState<Record<string, CSSProperties>>({})
  const [score, setScore] = useState({ right: 0, asked: 0 })
  const [finished, setFinished] = useState(false)
  const guessSet = useMemo(() => new Set(game.guess), [game.guess])
  useEffect(() => { setPly(0); setGuessing(null); setMark({}); setScore({ right: 0, asked: 0 }); setFinished(false) }, [game.id])

  const forward = () => {
    if (guessing === 'ask') return
    if (ply >= sans.length) return
    const nextPly = ply + 1
    if (guessSet.has(nextPly) && !guessing) { setGuessing('ask'); setMark({}); return }
    setGuessing(null); setMark({}); setPly(nextPly)
  }
  const back = () => { setGuessing(null); setMark({}); setPly((p) => Math.max(0, p - 1)) }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') forward(); if (e.key === 'ArrowLeft') back() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => {
    if (ply === sans.length && !finished) {
      setFinished(true)
      void (async () => {
        if (done) return
        await db.progress.put({ nodeId: `master:${game.id}`, status: 'mastered', score: 100, attempts: 1, lastAt: Date.now() })
        await addXp('lesson', GAME_XP, `master:${game.id}`)
        show(`${game.title} studied +${GAME_XP} XP`)
      })()
    }
  }, [ply, sans.length, finished, done, game.id, game.title, show])

  const lastMove = useMemo(() => { if (ply === 0) return null; const c = new Chess(fens[ply - 1]); const m = c.move(sans[ply - 1]); return { from: m.from, to: m.to } }, [ply, fens, sans])
  const expectedUci = useMemo(() => { if (ply >= sans.length) return ''; const c = new Chess(fens[ply]); const m = c.move(sans[ply]); return m.from + m.to + (m.promotion ?? '') }, [ply, fens, sans])

  const onMove = (from: string, to: string, promotion?: string) => {
    if (guessing !== 'ask' && guessing !== 'wrong') return false
    const c = new Chess(fens[ply]); const uci = from + to + (promotion ?? '')
    try { new Chess(fens[ply]).move({ from, to, promotion }) } catch { return false }
    if (isCorrectMove(c, uci, expectedUci)) {
      setScore((s) => ({ right: s.right + (guessing === 'ask' ? 1 : 0), asked: s.asked + (guessing === 'ask' ? 1 : 0) }))
      setMark({ [to]: OK }); setGuessing(null); setPly(ply + 1)
      return true
    }
    if (guessing === 'ask') setScore((s) => ({ ...s, asked: s.asked + 1 }))
    setMark({ [to]: BAD }); setGuessing('wrong'); setTimeout(() => setMark({}), 600)
    return false
  }
  const reveal = () => { setMark({ [expectedUci.slice(0, 2)]: BEST, [expectedUci.slice(2, 4)]: BEST }); if (guessing === 'ask') setScore((s) => ({ ...s, asked: s.asked + 1 })); setGuessing('wrong') }
  const playOn = () => { setGuessing(null); setMark({}); setPly(ply + 1) }

  const orientation = game.guessSide === 'w' ? 'white' : 'black'
  const note = game.notes[ply]
  const sideName = ply % 2 === 0 ? 'White' : 'Black'
  const idx = MASTER_GAMES.findIndex((g) => g.id === game.id); const next = MASTER_GAMES[idx + 1]

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow"><Link to="/library/games">Master games</Link> · {game.event} {game.year} · {game.result}</div><h1>{game.title}</h1><p className="muted">{game.white} – {game.black}</p></div>
        <span className="pill accent mono">Guesses {score.right}/{game.guess.length}</span>
      </div>
      <div className="two-col">
        <div className="board-wrap" data-ply={ply} data-guessing={guessing ?? 'no'}><Board fen={fens[ply]} orientation={orientation} interactive={guessing === 'ask' || guessing === 'wrong'} onMove={onMove} lastMove={guessing ? null : lastMove} highlights={mark} id="master" animationMs={150} /></div>
        <div className="stack">
          <div className="card">
            <p style={{ fontSize: 15 }} className="muted">{game.theme}</p>
          </div>
          <div className="card">
            {guessing ? (
              <>
                <div className="eyebrow">Guess the move</div>
                <h3 style={{ marginTop: 4 }}>{guessing === 'ask' ? `What did ${sideName} play here?` : `Not that one — the game continued ${sans[ply]}.`}</h3>
                <div className="row" style={{ marginTop: 10 }}>
                  {guessing === 'ask' && <button className="btn" onClick={reveal}>Show me</button>}
                  {guessing === 'wrong' && <button className="btn primary" onClick={playOn}>Play {sans[ply]} →</button>}
                </div>
              </>
            ) : (
              <>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3>{ply === 0 ? 'Start position' : `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'} ${sans[ply - 1]}`}</h3>
                  <span className="mono muted">{ply}/{sans.length}</span>
                </div>
                <p style={{ marginTop: 6, minHeight: 24 }}>{note ?? (finished ? <span style={{ color: 'var(--good)' }}>Game over — {game.result}. You found {score.right} of {game.guess.length} key moves.</span> : <span className="muted">→ to continue{guessSet.has(ply + 1) ? ' · next move is yours to guess' : ''}.</span>)}</p>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn sm" onClick={() => { setGuessing(null); setPly(0) }}>⏮</button><button className="btn sm" onClick={back}>←</button>
                  <button className="btn sm primary" onClick={forward} disabled={ply >= sans.length}>→</button>
                  {finished && next && <Link className="btn sm" to={`/library/games/${next.id}`}>Next game: {next.title} →</Link>}
                </div>
              </>
            )}
          </div>
          <div className="card flat" style={{ maxHeight: 220, overflowY: 'auto' }}>
            <div className="eyebrow">Moves</div>
            <p className="mono" style={{ fontSize: 14, lineHeight: 1.9, marginTop: 6 }}>
              {sans.slice(0, Math.max(ply, 0)).map((s, i) => <span key={i}>{i % 2 === 0 && <span className="muted">{i / 2 + 1}. </span>}<button onClick={() => { setGuessing(null); setMark({}); setPly(i + 1) }} style={{ background: ply === i + 1 ? 'var(--accent-soft)' : 'transparent', border: 0, padding: '0 4px', borderRadius: 4, font: 'inherit', cursor: 'pointer' }}>{s}</button> </span>)}
              {ply < sans.length && <span className="muted">…</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
