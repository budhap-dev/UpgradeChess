import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { Board } from '@/shared/ui/Board'
import { HINT_RING } from '@/shared/ui/boardStyles'
import { TRICKS, type Trick } from './tricks'
import { db } from '@/shared/db/db'
import { addXp } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'
import { isCorrectMove, uciToMove } from '@/shared/chess/puzzle'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

const KIND = { gambit: 'Gambit', trap: 'Trap', trick: 'Quick trick' } as const
const TRICK_XP = 15
const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const BEST = HINT_RING

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
        <PageHead
          eyebrow={<span className="crumbs"><Link to="/openings">Openings</Link><span aria-hidden="true">/</span><span>Tricks</span></span>}
          title="Gambits & quick tricks"
          sub={<>Gambits to play for the initiative, traps your opponents fall into, and the cheap tricks you must never fall for yourself. Step through each line, then <strong>Test me</strong> on the key move for +{TRICK_XP} XP.</>}
          actions={<span className="pill accent mono">{solved.size}/{TRICKS.filter((t) => t.task).length} tested</span>}
        />
        <div className="chip-row" role="group" aria-label="Filter">
          {([['all', 'All'], ['w', 'For White'], ['b', 'For Black'], ['gambit', 'Gambits'], ['trap', 'Traps'], ['trick', 'Quick tricks']] as const).map(([k, l]) => <button key={k} type="button" className={`chip${filter === k ? ' active' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
        </div>
        <ul className="list">
          {list.map((t) => (
            <li key={t.id}>
              <Link to={`/tricks/${t.id}`} className={`node ${solved.has(t.id) ? 'mastered' : 'available'}`}>
                <span className="mark">{solved.has(t.id) ? <Icon name="check" size={20} strokeWidth={2.4} /> : <span className={`side-swatch ${t.side}`} aria-label={t.side === 'w' ? 'White' : 'Black'} />}</span>
                <span className="body">
                  <span className="title">{t.name} <span className="pill" style={{ marginLeft: 6, verticalAlign: 'middle' }}>{KIND[t.kind]}</span></span>
                  <span className="desc">{t.idea}</span>
                </span>
                <span className="end mono muted" style={{ fontSize: 12 }}>{t.eco}</span>
              </Link>
            </li>
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
      <PageHead
        eyebrow={<span className="crumbs"><Link to="/tricks">Gambits & tricks</Link><span aria-hidden="true">/</span><span>{KIND[trick.kind]} · {trick.side === 'w' ? 'White' : 'Black'}{trick.eco ? ` · ${trick.eco}` : ''}</span></span>}
        title={trick.name}
        actions={solved && <span className="pill good"><Icon name="check" size={14} strokeWidth={2.4} />Tested</span>}
      />
      <div className="two-col">
        <div className="board-wrap" data-test-state={test?.state ?? 'browse'}><Board fen={test ? test.fen : fens[ply]} orientation={orientation} interactive={!!test && test.state === 'ask'} onMove={onMove} lastMove={test ? null : lastMove} highlights={mark} id="trick" animationMs={150} /></div>
        <div className="panel">
          <div className="card stack tight">
            <p style={{ fontSize: 17 }}>{trick.idea}</p>
            {trick.avoid && <p className="muted" style={{ fontSize: 14 }}><strong>How to avoid it:</strong> {trick.avoid}</p>}
          </div>
          {test ? (
            <div className="card stack tight">
              <div className="eyebrow">Test me</div>
              {test.state === 'ask' ? <h2>{task!.prompt}</h2> : test.state === 'right'
                ? <div className="status-head"><Icon name="check" size={22} strokeWidth={2.4} className="good" /><h2 className="good">Exactly.</h2></div>
                : <div className="status-head"><Icon name="x" size={22} strokeWidth={2.4} className="bad" /><h2 className="bad">Not that one.</h2></div>}
              {test.state !== 'ask' && <p className="muted">{task!.explain}</p>}
              <div className="row" style={{ marginTop: 6 }}>
                {test.state === 'wrong' && <button className="btn primary" onClick={startTest}><Icon name="retry" size={18} />Try again</button>}
                {test.state === 'right' && next && <Link className="btn primary" to={`/tricks/${next.id}`}>Next: {next.name} <Icon name="arrow-right" size={18} /></Link>}
                <button className="btn ghost" onClick={() => { setTest(null); setMark({}) }}>Back to the line</button>
              </div>
            </div>
          ) : (
            <div className="card stack tight">
              <div className="row between">
                <h2>{ply === 0 ? 'Start position' : `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '…'} ${sans[ply - 1]}`}</h2>
                <span className="mono muted">{ply}/{sans.length}</span>
              </div>
              <p style={{ minHeight: 24 }}>{note ?? <span className="muted">Use → to step through the line.</span>}</p>
              <div className="row" style={{ marginTop: 6 }}>
                <span className="row" style={{ gap: 6 }}>
                  <button className="icon-btn" onClick={() => setPly(0)} disabled={ply === 0} aria-label="Start of line" title="Start"><Icon name="first" /></button>
                  <button className="icon-btn" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0} aria-label="Previous move" title="Previous (←)"><Icon name="chevron-left" /></button>
                  <button className="icon-btn" onClick={() => setPly((p) => Math.min(sans.length, p + 1))} disabled={ply >= sans.length} aria-label="Next move" title="Next (→)"><Icon name="chevron-right" /></button>
                  <button className="icon-btn" onClick={() => setPly(sans.length)} disabled={ply >= sans.length} aria-label="End of line" title="End"><Icon name="last" /></button>
                </span>
                {task && <button className="btn primary" onClick={startTest}><Icon name="target" size={18} />Test me{solved ? ' again' : ` (+${TRICK_XP} XP)`}</button>}
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-head" style={{ marginBottom: 6 }}><h3>Line</h3></div>
            <p className="moves">
              {sans.map((m, i) => <span key={i}>{i % 2 === 0 && <span className="n">{i / 2 + 1}. </span>}<button aria-current={ply === i + 1 && !test} onClick={() => { setTest(null); setMark({}); setPly(i + 1) }}>{m}</button> </span>)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
