import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PuzzleTrainer } from './PuzzleTrainer'
import { db, getSetting, setSetting } from '@/shared/db/db'
import { addXp } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'
import { useLiveQuery } from 'dexie-react-hooks'

const DURATION = 180, MAX_ERRORS = 3, COMBO_BONUS = 5

/** Puzzle Storm: 3 minutes, rising difficulty, 3 mistakes end the run, every 5-solve combo adds +5 s. */
export function StormMode({ aside }: { aside: ReactNode }) {
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [combo, setCombo] = useState(0)
  const [done, setDone] = useState<{ score: number; best: number } | null>(null)
  const show = useToast((t) => t.show)
  const best = useLiveQuery(() => getSetting<number>('stormBest', 0), []) ?? 0
  const timer = useRef<ReturnType<typeof setInterval>>(undefined)
  const scoreRef = useRef(0)
  const endedRef = useRef(false)

  const finish = async () => {
    if (endedRef.current) return
    endedRef.current = true
    clearInterval(timer.current); setRunning(false)
    const s = scoreRef.current
    const prevBest = await getSetting<number>('stormBest', 0)
    if (s > prevBest) await setSetting('stormBest', s)
    if (s > 0) { await addXp('themed_set', s * 2, 'storm'); show(`Storm over: ${s} solved · +${s * 2} XP`) }
    await db.settings.put({ key: 'stormLast', value: { score: s, at: Date.now() } })
    setDone({ score: s, best: Math.max(s, prevBest) })
  }
  const start = () => { setScore(0); scoreRef.current = 0; setErrors(0); setCombo(0); setLeft(DURATION); setDone(null); endedRef.current = false; setRunning(true) }
  useEffect(() => {
    if (!running) return
    timer.current = setInterval(() => setLeft((l) => { if (l <= 1) { void finish(); return 0 } return l - 1 }), 1000)
    return () => clearInterval(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const onResult = (solved: boolean) => {
    if (solved) {
      scoreRef.current += 1; setScore(scoreRef.current)
      setCombo((c) => { const n = c + 1; if (n % 5 === 0) { setLeft((l) => l + COMBO_BONUS) } return n })
    } else { setCombo(0); setErrors((e) => { const n = e + 1; if (n >= MAX_ERRORS) void finish(); return n }) }
  }

  const header = (
    <div className="card flat">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="stat"><span className="v mono" style={{ color: left <= 15 ? 'var(--bad)' : undefined }}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span><span className="l">time left</span></span>
        <span className="stat"><span className="v mono">{score}</span><span className="l">solved · combo {combo}</span></span>
        <span className="stat"><span className="v mono" style={{ color: 'var(--bad)' }}>{'✕'.repeat(errors)}{'·'.repeat(MAX_ERRORS - errors)}</span><span className="l">mistakes</span></span>
        <span className="stat"><span className="v mono">{best}</span><span className="l">best</span></span>
      </div>
    </div>
  )

  if (!running) {
    return (
      <div className="stack">
        {header}
        <div className="card">
          {done ? <h3>{done.score} solved{done.score >= done.best && done.score > 0 ? ' — new best!' : ''}</h3> : <h3>Puzzle Storm</h3>}
          <p className="muted" style={{ marginTop: 6 }}>Three minutes. Puzzles start easy and get harder with every solve; three mistakes end the run; every 5-solve combo adds 5 seconds. No hints, no rating — pure pattern speed. 2 XP per solve.</p>
          <button className="btn primary" style={{ marginTop: 10 }} onClick={start}>{done ? 'Run again' : 'Start storm'}</button>
        </div>
        {aside}
      </div>
    )
  }
  return (
    <div className="stack">
      {header}
      <PuzzleTrainer mode="storm" options={{ onResult }} autoAdvanceMs={500} aside={aside} />
    </div>
  )
}
