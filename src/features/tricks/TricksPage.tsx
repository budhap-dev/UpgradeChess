import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '@/shared/ui/Board'
import { TRICKS, type Trick } from './tricks'
import { db } from '@/shared/db/db'
import { addXp } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'
import { isCorrectMove, uciToMove } from '@/shared/chess/puzzle'

const KIND = { gambit: 'Gambit', trap: 'Trap', trick: 'Quick trick' } as const
const TRICK_XP = 15
const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const BEST: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--info)' }

export default function TricksPage() {
  const { trickId } = useParams()
  const trick = TRICKS.find((t) => t.id === trickId) ?? null
  const solvedRows = useLiveQuery(() => db.progress.filter((p) => p.nodeId.startsWith('trick:')).toArray(), []) ?? []
  const solved = useMemo(() => new Set(solvedRows.map((p) => p.nodeId.slice(6))), [solvedRows])
  const [filter, setFilter] = useState<'all' | 'w' | 'b' | 'gambit' | 'trap' | 'trick'>('all')

  if (!trick) {
    const list = TRICKS.filter((t) => filter === 'all' || t.side === filter || t.kind === filter)
    return (
      <div className="stack">
        <div className="page-head">
          <div><div className="eyebrow">Openings</div><h1>Gambits & quick tricks</h1></div>
          <span className="pill accent mono">{solved.size}/{TRICKS.filter((t) => t.task).length} tested</span>
        </div>
        <p className="muted">Gambits to play for the initiative, traps your opponents fall into, and the cheap tricks you must never fall for yourself. Step through each line, then <strong>Test me</strong> on the key move for +{TRICK_XP} XP.</p>
        <div className="row">
          {([['all', 'All'], ['w', 'For White'], ['b', 'For Black'], ['gambit', 'Gambits'], ['trap', 'Traps'], ['trick', 'Quick tricks']] as const).map(([k, l]) => <button key={k} className={`btn sm ${filter === k ? 'primary' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        <ul className="list">
          {list.map((t) => (
            <Link key={t.id} to={`/tricks/${t.id}`} className={`node ${solved.has(t.id) ? 'mastered' : 'available'}`}>
              <span className="mark">{solved.has(t.id) ? '✓' : t.side === 'w' ? '♙' : '♟'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong>{t.name}</strong> <span className="pill" style={{ marginLeft: 6 }}>{KIND[t.kind]}</span>
                <br /><span className="muted" style={{ fontSize: 14 }}>{t.idea}</span>
              </span>
              <span className="mono muted" style={{ fontSize: 12 }}>{t.eco}</span>
            </Link>
          ))}
        </ul>
      </div>
    )
  }
  return <TrickDetail trick={trick} solved={solved.has(trick.id)} />
}

function TrickDetail({ trick, solved }: { trick: Trick; solved: boolean }) {
  const show = useToast((t) => t.show)
  const sans = useMemo(() => trick.line.split(' '), [trick.line])
  const fens = useMemo(() => { const c = new Chess(); const out = [c.fen()]; for (const s of sans) { c.move(s); out.push(c.fen()) } return out }, [sans])
  const [ply, setPly] = useState(0)
  const [test, setTest] = useState<{ fen: string; state: 'ask' | 'right' | 'wrong'; step: number } | null>(null)
  const [mark, setMark] = useState<Record<string, CSSProperties>>({})
  useEffect(() => { setPly(0); setTest(null); setMark({}) }, [trick.id])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (test) return; if (e.key === 'ArrowRight') setPly((p) => Math.min(sans.length, p + 1)); if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, p - 1)) }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [sans.length, test])

  const lastMove = useMemo(() => { if (ply === 0) return null; const c = new Chess(fens[ply - 1]); const m = c.move(sans[ply - 1]); return { from: m.from, to: m.to } }, [ply, fens, sans])
  const note = trick.notes[ply]
  const orientation = trick.side === 'w' ? 'white' : 'black'
  const task = trick.task

  const startTest = () => { if (!task) return; setPly(task.ply); setTest({ fen: fens[task.ply], state: 'ask', step: 0 }); setMark({}) }
  const onMove = (from: string, to: string, promotion?: string) => {
    if (!test || !task || test.state !== 'ask') return false
    const c = new Chess(test.fen)
    const uci = from + to + (promotion ?? '')
    try { new Chess(test.fen).move({ from, to, promotion }) } catch { return false }
    const expected = task.solution[test.step]
    const ok = (test.step === 0 && task.accept?.includes(uci)) || isCorrectMove(c, uci, expected)
    if (!ok) { setMark({ [to]: BAD, [expected.slice(0, 2)]: BEST, [expected.slice(2, 4)]: BEST }); setTest({ ...test, state: 'wrong' }); return false }
    c.move({ from, to, promotion })
    const next = test.step + 1
    const done = next >= task.solution.length || (test.step === 0 && uci !== expected)
    setMark({ [to]: OK })
    if (done) { setTest({ fen: c.fen(), state: 'right', step: next }); void award(); return true }
    // opponent reply
    const r = c.move(uciToMove(task.solution[next]))
    setMark({ [to]: OK, [r.to]: {} })
    const after = next + 1
    if (after >= task.solution.length) { setTest({ fen: c.fen(), state: 'right', step: after }); void award() }
    else setTest({ fen: c.fen(), state: 'ask', step: after })
    return true
  }
  const award = async () => {
    if (solved) return
    await db.progress.put({ nodeId: `trick:${trick.id}`, status: 'mastered', score: 100, attempts: 1, lastAt: Date.now() })
    await addXp('lesson', TRICK_XP, `trick:${trick.id}`)
    show(`${trick.name} +${TRICK_XP} XP`)
  }
  const idx = TRICKS.findIndex((t) => t.id === trick.id)
  const next = TRICKS[idx + 1]

  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow"><Link to="/tricks">Gambits & tricks</Link> · {KIND[trick.kind]} · {trick.side === 'w' ? 'White' : 'Black'}{trick.eco ? ` · ${trick.eco}` : ''}</div><h1>{trick.name}</h1></div>
        {solved && <span className="pill good">Tested ✓</span>}
      </div>
      <div className="two-col">
        <div className="board-wrap" data-test-state={test?.state ?? 'browse'}><Board fen={test ? test.fen : fens[ply]} orientation={orientation} interactive={!!test && test.state === 'ask'} onMove={onMove} lastMove={test ? null : lastMove} highlights={mark} id="trick" animationMs={150} /></div>
        <div className="stack">
          <div className="card">
            <p style={{ fontSize: 17 }}>{trick.idea}</p>
            {trick.avoid && <p className="muted" style={{ marginTop: 8, fontSize: 14 }}><strong>How to avoid it:</strong> {trick.avoid}</p>}
          </div>
          {test ? (
            <div className="card">
              <div className="eyebrow">Test me</div>
              <h3 style={{ marginTop: 4 }}>{test.state === 'ask' ? task!.prompt : test.state === 'right' ? '✓ Exactly.' : 'Not that one.'}</h3>
              {test.state !== 'ask' && <p className="muted" style={{ marginTop: 6 }}>{task!.explain}</p>}
              <div className="row" style={{ marginTop: 10 }}>
                {test.state === 'wrong' && <button className="btn primary" onClick={startTest}>Try again</button>}
                {test.state === 'right' && next && <Link className="btn primary" to={`/tricks/${next.id}`}>Next: {next.name} →</Link>}
                <button className="btn ghost" onClick={() => { setTest(null); setMark({}) }}>Back to the line</button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3>{ply === 0 ? 'Start position' : `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'} ${sans[ply - 1]}`}</h3>
                <span className="mono muted">{ply}/{sans.length}</span>
              </div>
              <p style={{ marginTop: 6, minHeight: 24 }}>{note ?? <span className="muted">Use → to step through the line.</span>}</p>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn sm" onClick={() => setPly(0)}>⏮</button><button className="btn sm" onClick={() => setPly((p) => Math.max(0, p - 1))}>←</button>
                <button className="btn sm" onClick={() => setPly((p) => Math.min(sans.length, p + 1))}>→</button><button className="btn sm" onClick={() => setPly(sans.length)}>⏭</button>
                {task && <button className="btn primary sm" onClick={startTest}>Test me{solved ? ' again' : ` (+${TRICK_XP} XP)`}</button>}
              </div>
            </div>
          )}
          <div className="card flat">
            <div className="eyebrow">Line</div>
            <p className="mono" style={{ fontSize: 14, lineHeight: 1.9, marginTop: 6 }}>
              {sans.map((s, i) => <span key={i}>{i % 2 === 0 && <span className="muted">{i / 2 + 1}. </span>}<button onClick={() => { setTest(null); setMark({}); setPly(i + 1) }} style={{ background: ply === i + 1 && !test ? 'var(--accent-soft)' : 'transparent', border: 0, padding: '0 4px', borderRadius: 4, font: 'inherit', cursor: 'pointer' }}>{s}</button> </span>)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
