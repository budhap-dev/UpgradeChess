import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery } from '@tanstack/react-query'
import { Board } from '@/shared/ui/Board'
import { HINT_RING } from '@/shared/ui/boardStyles'
import { REPERTOIRES } from '@/features/path/repertoires'
import { CURRICULUM } from '@/features/path/curriculum'
import { buildTree, randomLine, type MoveNode } from './tree'
import { db, DAY_KEY, type SrsCard } from '@/shared/db/db'
import { scheduleSm2, NEW_CARD } from '@/shared/rating/sm2'
import { addXp } from '@/shared/db/xp'
import { XP } from '@/config/scoring'
import { useToast } from '@/shared/ui/toastStore'
import { fetchExplorer } from '@/shared/api/lichess'
import { uciToMove } from '@/shared/chess/puzzle'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const HINT = HINT_RING
const key = (fen: string) => fen.split(' ').slice(0, 4).join(' ')

export default function OpeningsPage() {
  const { repId } = useParams()
  const rep = REPERTOIRES.find((r) => r.id === repId) ?? null
  const show = useToast((t) => t.show)
  const tree = useMemo(() => (rep ? buildTree(rep) : null), [rep])
  const cards = useLiveQuery(async () => (rep ? db.srsCards.where('repertoireId').equals(rep.id).toArray() : ([] as SrsCard[])), [rep?.id]) ?? []
  const allCards = useLiveQuery(() => db.srsCards.toArray(), []) ?? []
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  const chessRef = useRef(new Chess())
  const [line, setLine] = useState<MoveNode[]>([])
  const [idx, setIdx] = useState(0)           // next node index in line to play
  const [fen, setFen] = useState(new Chess().fen())
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [mark, setMark] = useState<Record<string, CSSProperties>>({})
  const [msg, setMsg] = useState<string>('')
  const [missed, setMissed] = useState(false)
  const [hinted, setHinted] = useState(false)
  const [lineDone, setLineDone] = useState(false)
  const [showExplorer, setShowExplorer] = useState(false)
  const [linesDone, setLinesDone] = useState(0)

  const explorer = useQuery({ queryKey: ['explorer', key(fen)], enabled: showExplorer && navigator.onLine, queryFn: () => fetchExplorer(fen), staleTime: 24 * 3600_000 })

  const startLine = useCallback(() => {
    if (!tree || !rep) return
    const l = randomLine(tree.root)
    chessRef.current = new Chess()
    setLine(l); setIdx(0); setFen(chessRef.current.fen()); setLastMove(null); setMark({}); setMsg(''); setMissed(false); setHinted(false); setLineDone(false)
  }, [tree, rep])
  useEffect(() => { startLine() }, [startLine])

  // Auto-play opponent moves
  useEffect(() => {
    if (!rep || !line.length || lineDone) return
    const c = chessRef.current
    if (idx >= line.length) { setLineDone(true); return }
    if (c.turn() !== rep.side) {
      const t = setTimeout(() => {
        const n = line[idx]
        const m = c.move(uciToMove(n.uci))
        setFen(c.fen()); setLastMove({ from: m.from, to: m.to }); setIdx((k) => k + 1)
      }, idx === 0 ? 300 : 450)
      return () => clearTimeout(t)
    }
  }, [idx, line, rep, lineDone])

  const grade = useCallback(async (cardId: string, q: 0 | 1 | 2 | 3 | 4 | 5, fenBefore: string, move: string, san: string) => {
    if (!rep) return
    const existing = await db.srsCards.get(cardId)
    const wasDue = !existing || existing.due <= Date.now()
    const next = scheduleSm2(existing ?? NEW_CARD, q)
    await db.srsCards.put({ id: cardId, repertoireId: rep.id, fen: fenBefore, move, san, ...next })
    if (wasDue && q >= 3) {
      const today = await db.xpEvents.where('day').equals(DAY_KEY()).filter((e) => e.type === 'opening_card').toArray()
      const spent = today.reduce((a, e) => a + e.xp, 0)
      if (spent < XP.openingCardDailyCap) await addXp('opening_card', XP.openingCardReviewed, cardId)
    }
  }, [rep])

  const onMove = (from: string, to: string, promotion?: string) => {
    if (!rep || !tree || lineDone) return false
    const c = chessRef.current
    if (c.turn() !== rep.side || idx >= line.length) return false
    const expected = line[idx]
    const uci = from + to + (promotion ?? '')
    const cardId = `${rep.id}:${key(c.fen())}`
    const fenBefore = c.fen()
    if (uci !== expected.uci) {
      try { new Chess(c.fen()).move({ from, to, promotion }) } catch { return false }
      setMark({ [to]: BAD }); setMissed(true); setMsg(`Not in your repertoire here. The line continues ${expected.san}.`)
      setTimeout(() => setMark({ [expected.uci.slice(0, 2)]: HINT, [expected.uci.slice(2, 4)]: HINT }), 300)
      return false
    }
    const m = c.move({ from, to, promotion })
    setFen(c.fen()); setLastMove({ from: m.from, to: m.to }); setMark({ [m.to]: OK }); setMsg('')
    void grade(cardId, missed ? 2 : hinted ? 3 : 5, fenBefore, uci, expected.san)
    setMissed(false); setHinted(false)
    setIdx((k) => k + 1)
    return true
  }

  const hint = () => { if (idx < line.length) { const n = line[idx]; setMark({ [n.uci.slice(0, 2)]: HINT }); setHinted(true) } }

  // Node mastery: all cards seen and ≥70% with reps ≥ 2
  useEffect(() => {
    if (!rep || !tree || !lineDone) return
    ;(async () => {
      setLinesDone((n) => n + 1)
      const node = CURRICULUM.find((n) => n.repertoireId === rep.id)
      if (!node) return
      const seen = tree.cards.filter((c) => cardById.has(c.id)).length
      const strong = tree.cards.filter((c) => (cardById.get(c.id)?.reps ?? 0) >= 2).length
      const score = Math.round(((seen + strong) / (tree.cards.length * 2)) * 100)
      const prev = await db.progress.get(node.id)
      const mastered = seen === tree.cards.length && strong / tree.cards.length >= 0.7
      if (prev?.status === 'mastered') return
      await db.progress.put({ nodeId: node.id, status: mastered ? 'mastered' : 'in-progress', score, attempts: (prev?.attempts ?? 0) + 1, lastAt: Date.now() })
      if (mastered) { await addXp('drill', node.xp, node.id); show(`${rep.name} mastered +${node.xp} XP`) }
    })()
  }, [lineDone, rep, tree, cardById, show])

  const due = allCards.filter((c) => c.due <= Date.now()).length

  if (!rep || !tree) {
    return (
      <div className="stack">
        <PageHead eyebrow="Repertoire" title="Openings" sub="Ideas first, then the moves. Each repertoire is a small tree of lines; you drill it with spaced repetition and earn XP for every due card you recall." actions={due > 0 && <span className="pill warn mono">{due} card{due > 1 ? 's' : ''} due</span>} />
        <Link to="/tricks" className="card node-card">
          <span className="mark-lg"><Icon name="zap" size={22} /></span>
          <span className="grow">
            <h3>Gambits & quick tricks</h3>
            <span className="muted" style={{ fontSize: 14 }}>Traps to set, traps to dodge, and gambits worth playing: step-through lines with a test on the key move.</span>
          </span>
          <Icon name="chevron-right" className="muted" />
        </Link>
        <div className="grid cols-2">
          {REPERTOIRES.map((r) => {
            const t = buildTree(r)
            const mine = allCards.filter((c) => c.repertoireId === r.id)
            const dueHere = mine.filter((c) => c.due <= Date.now()).length
            const seenPct = Math.round((mine.length / Math.max(1, t.cards.length)) * 100)
            return (
              <Link key={r.id} to={`/openings/${r.id}`} className="card stack tight">
                <div className="row between"><span className="eyebrow">{r.side === 'w' ? 'White' : 'Black'} · {r.eco}</span>{dueHere > 0 && <span className="pill warn mono">{dueHere} due</span>}</div>
                <h3>{r.name}</h3>
                <p className="muted" style={{ fontSize: 14 }}>{r.blurb}</p>
                <div className="row between" style={{ marginTop: 'auto', paddingTop: 6 }}><span className="mono muted" style={{ fontSize: 13 }}>{mine.length}/{t.cards.length} positions seen</span></div>
                <div className="progress thin"><span style={{ width: `${seenPct}%` }} /></div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const myTurn = chessRef.current.turn() === rep.side && !lineDone
  const sans = chessRef.current.history()
  const repDue = cards.filter((c) => c.due <= Date.now()).length
  return (
    <div className="stack">
      <PageHead
        eyebrow={<span className="crumbs"><Link to="/openings">Openings</Link><span aria-hidden="true">/</span><span>{rep.side === 'w' ? 'White' : 'Black'} · {rep.eco}</span></span>}
        title={rep.name}
        actions={<span className="pill mono">{cards.length}/{tree.cards.length} positions · {repDue} due</span>}
      />
      <div className="two-col">
        <div className="board-wrap"><Board fen={fen} orientation={rep.side === 'w' ? 'white' : 'black'} interactive={myTurn} onMove={onMove} lastMove={lastMove} highlights={mark} id="opening" animationMs={150} /></div>
        <div className="panel">
          <div className="card stack tight">
            {lineDone ? <div className="status-head"><Icon name="check" size={22} strokeWidth={2.4} className="good" /><h2 className="good">Line complete</h2></div> : <h2>{myTurn ? 'Your move' : 'Opponent is moving…'}</h2>}
            <p className="moves">{sans.length ? sans.map((m, i) => <span key={i}>{i % 2 === 0 && <span className="n">{i / 2 + 1}. </span>}{m} </span>) : <span className="muted">Start position</span>}</p>
            {msg && <div className="callout bad"><Icon name="x" size={18} /><span>{msg}</span></div>}
            <div className="row" style={{ marginTop: 4 }}>
              {!lineDone && <button className="btn secondary" onClick={hint}><Icon name="bulb" size={18} />Hint</button>}
              <button className="btn primary" onClick={startLine}>{lineDone ? <>Next line <Icon name="arrow-right" size={18} /></> : <><Icon name="retry" size={18} />Restart line</>}</button>
              <button className="btn ghost" onClick={() => setShowExplorer((v) => !v)} aria-expanded={showExplorer}>{showExplorer ? 'Hide explorer' : 'What do others play?'}</button>
            </div>
            {linesDone > 0 && <p className="muted" style={{ fontSize: 13 }}>{linesDone} line{linesDone > 1 ? 's' : ''} this session.</p>}
          </div>
          {showExplorer && (
            <div className="card">
              <div className="card-head"><h3>Lichess explorer</h3><span className="eyebrow">Rapid/blitz 1600–2000</span></div>
              {explorer.isLoading && <p className="muted">Loading…</p>}
              {explorer.error && <p className="muted">Explorer unavailable offline.</p>}
              {explorer.data && (
                <div className="table-wrap"><table className="table">
                  <thead><tr><th>Move</th><th className="num">Games</th><th className="num">W / D / B</th></tr></thead>
                  <tbody>{explorer.data.moves.slice(0, 6).map((m) => { const n = m.white + m.draws + m.black; return <tr key={m.uci}><td className="mono">{m.san}</td><td className="num">{n.toLocaleString()}</td><td className="num mono">{Math.round((m.white / n) * 100)} / {Math.round((m.draws / n) * 100)} / {Math.round((m.black / n) * 100)}</td></tr> })}</tbody>
                </table></div>
              )}
            </div>
          )}
          <div className="card">
            <div className="card-head" style={{ marginBottom: 8 }}><h3>Key ideas</h3></div>
            <ul className="prose" style={{ margin: 0, paddingLeft: 18 }}>{rep.ideas.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  )
}
