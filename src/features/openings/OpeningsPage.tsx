import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery } from '@tanstack/react-query'
import { Board } from '@/shared/ui/Board'
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

const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }
const HINT: CSSProperties = { boxShadow: 'inset 0 0 0 4px var(--info)' }
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
        <div className="page-head"><div><div className="eyebrow">Repertoire</div><h1>Openings</h1></div>{due > 0 && <span className="pill warn">{due} cards due</span>}</div>
        <p className="muted">Ideas first, then the moves. Each repertoire is a small tree of lines; you drill it with spaced repetition and earn XP for every due card you recall.</p>
        <Link to="/tricks" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><h3>⚡ Gambits & quick tricks</h3><span className="btn sm">Open →</span></div>
          <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>Traps to set, traps to dodge, and gambits worth playing — step-through lines with a test on the key move.</p>
        </Link>
        <div className="grid cols-2">
          {REPERTOIRES.map((r) => {
            const t = buildTree(r)
            const mine = allCards.filter((c) => c.repertoireId === r.id)
            const dueHere = mine.filter((c) => c.due <= Date.now()).length
            return (
              <Link key={r.id} to={`/openings/${r.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="eyebrow">{r.side === 'w' ? 'White' : 'Black'} · {r.eco}</div>
                <h3 style={{ marginTop: 4 }}>{r.name}</h3>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{r.blurb}</p>
                <div className="row" style={{ marginTop: 8 }}><span className="pill mono">{mine.length}/{t.cards.length} positions seen</span>{dueHere > 0 && <span className="pill warn mono">{dueHere} due</span>}</div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  const myTurn = chessRef.current.turn() === rep.side && !lineDone
  const sans = chessRef.current.history()
  return (
    <div className="stack">
      <div className="page-head">
        <div><div className="eyebrow"><Link to="/openings">Openings</Link> · {rep.side === 'w' ? 'White' : 'Black'} · {rep.eco}</div><h1>{rep.name}</h1></div>
        <span className="pill mono">{cards.length}/{tree.cards.length} positions · {cards.filter((c) => c.due <= Date.now()).length} due</span>
      </div>
      <div className="two-col">
        <div className="board-wrap"><Board fen={fen} orientation={rep.side === 'w' ? 'white' : 'black'} interactive={myTurn} onMove={onMove} lastMove={lastMove} highlights={mark} id="opening" animationMs={150} /></div>
        <div className="stack">
          <div className="card">
            {lineDone ? <h3 style={{ color: 'var(--good)' }}>Line complete ✓</h3> : <h3>{myTurn ? 'Your move' : 'Opponent is moving…'}</h3>}
            <p className="mono muted" style={{ fontSize: 14, marginTop: 6, lineHeight: 1.7 }}>{sans.length ? sans.map((m, i) => <span key={i}>{i % 2 === 0 && <span>{i / 2 + 1}. </span>}{m} </span>) : 'Start position'}</p>
            {msg && <p style={{ color: 'var(--bad)', marginTop: 6 }}>{msg}</p>}
            <div className="row" style={{ marginTop: 10 }}>
              {!lineDone && <button className="btn" onClick={hint}>Hint</button>}
              <button className="btn primary" onClick={startLine}>{lineDone ? 'Next line →' : 'Restart line'}</button>
              <button className="btn ghost" onClick={() => setShowExplorer((v) => !v)}>{showExplorer ? 'Hide explorer' : 'What do others play?'}</button>
            </div>
            {linesDone > 0 && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{linesDone} line{linesDone > 1 ? 's' : ''} this session.</p>}
          </div>
          {showExplorer && (
            <div className="card flat">
              <div className="eyebrow">Lichess explorer · rapid/blitz 1600–2000</div>
              {explorer.isLoading && <p className="muted">Loading…</p>}
              {explorer.error && <p className="muted">Explorer unavailable offline.</p>}
              {explorer.data && (
                <table className="table" style={{ marginTop: 6 }}>
                  <thead><tr><th>Move</th><th className="num">Games</th><th className="num">W / D / B</th></tr></thead>
                  <tbody>{explorer.data.moves.slice(0, 6).map((m) => { const n = m.white + m.draws + m.black; return <tr key={m.uci}><td className="mono">{m.san}</td><td className="num">{n.toLocaleString()}</td><td className="num mono">{Math.round((m.white / n) * 100)} / {Math.round((m.draws / n) * 100)} / {Math.round((m.black / n) * 100)}</td></tr> })}</tbody>
                </table>
              )}
            </div>
          )}
          <div className="card flat">
            <div className="eyebrow">Key ideas</div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{rep.ideas.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  )
}
