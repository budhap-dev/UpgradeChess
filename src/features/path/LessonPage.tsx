import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Board } from '@/shared/ui/Board'
import { HINT_RING } from '@/shared/ui/boardStyles'
import { CURRICULUM, TRACK_LABEL } from './curriculum'
import { db } from '@/shared/db/db'
import { addXp } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'
import { isCorrectMove, uciToMove } from '@/shared/chess/puzzle'
import { routeFor } from './progression'
import { Icon } from '@/shared/ui/Icon'
import { PageHead } from '@/shared/ui/PageHead'

const HL = HINT_RING
const OK: CSSProperties = { background: 'color-mix(in srgb, var(--good) 45%, transparent)' }
const BAD: CSSProperties = { background: 'color-mix(in srgb, var(--bad) 50%, transparent)' }

/** Minimal markdown: **bold** and *italic*. */
function rich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p.startsWith('*') ? <em key={i}>{p.slice(1, -1)}</em> : <span key={i}>{p}</span>)
}

export default function LessonPage() {
  const { nodeId } = useParams()
  const nav = useNavigate()
  const show = useToast((t) => t.show)
  const node = CURRICULUM.find((n) => n.id === nodeId)
  const steps = node?.steps ?? []
  const [i, setI] = useState(0)
  const step = steps[i]
  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState<string>(step?.task?.fen ?? step?.fen ?? new Chess().fen())
  const [taskState, setTaskState] = useState<'open' | 'wrong' | 'done'>('open')
  const [ply, setPly] = useState(0)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [mark, setMark] = useState<Record<string, CSSProperties>>({})
  const [passed, setPassed] = useState<boolean[]>(() => steps.map((s) => !s.task))

  useEffect(() => {
    const s = steps[i]
    const f = s?.task?.fen ?? s?.fen
    if (f) { chessRef.current = new Chess(f); setFen(f) }
    setTaskState('open'); setPly(0); setLastMove(null); setMark({})
  }, [i, steps])

  const highlights = useMemo(() => {
    const h: Record<string, CSSProperties> = { ...mark }
    for (const sq of step?.highlight ?? []) h[sq] = HL
    return h
  }, [mark, step])

  if (!node || !steps.length) return <div className="card empty-state"><p>Lesson not found. <Link to="/path">Back to path</Link></p></div>

  // orient to the side that solves the task, fixed for the whole step (never flips mid-line)
  const orientation = step.task ? (new Chess(step.task.fen).turn() === 'b' ? 'black' : 'white') : 'white'

  const onMove = (from: string, to: string, promotion?: string) => {
    const t = step.task
    if (!t || taskState === 'done') return false
    const c = chessRef.current
    const uci = from + to + (promotion ?? '')
    const expected = t.solution[ply]
    const ok = (ply === 0 && t.accept?.includes(uci)) || isCorrectMove(c, uci, expected)
    if (!ok) {
      try { new Chess(c.fen()).move({ from, to, promotion }) } catch { return false }
      setTaskState('wrong'); setMark({ [to]: BAD })
      setTimeout(() => setMark({}), 700)
      return false
    }
    const m = c.move({ from, to, promotion })
    setFen(c.fen()); setLastMove({ from: m.from, to: m.to }); setMark({ [m.to]: OK })
    const next = ply + 1
    if (next >= t.solution.length || (ply === 0 && t.accept?.includes(uci) && uci !== expected)) {
      setTaskState('done'); setPassed((p) => p.map((v, k) => (k === i ? true : v)))
      return true
    }
    setTimeout(() => {
      const r = c.move(uciToMove(t.solution[next]))
      setFen(c.fen()); setLastMove(r ? { from: r.from, to: r.to } : null); setPly(next + 1)
      if (next + 1 >= t.solution.length) { setTaskState('done'); setPassed((p) => p.map((v, k) => (k === i ? true : v))) }
    }, 400)
    setPly(next)
    return true
  }

  const finish = async () => {
    const prev = await db.progress.get(node.id)
    const first = prev?.status !== 'mastered'
    await db.progress.put({ nodeId: node.id, status: 'mastered', score: 100, attempts: (prev?.attempts ?? 0) + 1, lastAt: Date.now() })
    if (first) { await addXp('lesson', node.xp, node.id); show(`Lesson complete +${node.xp} XP`) } else show('Lesson reviewed')
    const next = CURRICULUM.find((n) => (n.requires ?? []).includes(node.id))
    nav(next ? routeFor(next) : '/path')
  }

  const allPassed = passed.every(Boolean)
  const isLast = i === steps.length - 1

  return (
    <div className="stack">
      <PageHead
        eyebrow={<span className="crumbs"><Link to="/path">Path</Link><span aria-hidden="true">/</span><span>{TRACK_LABEL[node.track]}</span><span aria-hidden="true">·</span><span>Step {i + 1} of {steps.length}</span></span>}
        title={node.title}
      />
      <div className="steps" aria-hidden="true">{steps.map((_, k) => <span key={k} className={k <= i ? 'on' : ''} />)}</div>
      <div className="two-col">
        <div className="board-wrap" data-task-state={step.task ? taskState : 'none'}><Board fen={fen} orientation={orientation} interactive={!!step.task && taskState !== 'done'} onMove={onMove} lastMove={lastMove} highlights={highlights} id="lesson" animationMs={150} /></div>
        <div className="panel">
          <div className="card stack">
            <p className="prose" style={{ fontSize: 17 }}>{rich(step.text)}</p>
            {step.task && (
              <div className="stack tight">
                <p><strong>Your move:</strong> {step.task.prompt}</p>
                {taskState === 'wrong' && <div className="callout bad"><Icon name="x" size={18} /><span>Not that one. Look again.{ply > 0 && ' Continue the line.'}</span></div>}
                {taskState === 'done' && <div className="callout good"><Icon name="check" size={18} strokeWidth={2.4} /><span>{step.task.explain}</span></div>}
                {taskState !== 'done' && <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => { const c = chessRef.current; for (let k = ply; k < step.task!.solution.length; k++) { const r = c.move(uciToMove(step.task!.solution[k])); if (r) setLastMove({ from: r.from, to: r.to }) } setFen(c.fen()); setTaskState('done'); setPassed((p) => p.map((v, k) => (k === i ? true : v))) }}><Icon name="eye" size={18} />Show me</button>}
              </div>
            )}
          </div>
          <div className="row">
            <button className="btn" disabled={i === 0} onClick={() => setI((k) => k - 1)}><Icon name="arrow-left" size={18} />Back</button>
            {!isLast && <button className="btn primary" disabled={!!step.task && !passed[i]} onClick={() => setI((k) => k + 1)}>Next <Icon name="arrow-right" size={18} /></button>}
            {isLast && <button className="btn primary" disabled={!allPassed} onClick={finish}><Icon name="check" size={18} />Complete lesson</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
