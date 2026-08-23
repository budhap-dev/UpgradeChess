import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PuzzleTrainer } from './PuzzleTrainer'
import { loadPack } from './puzzleSource'
import { db, getSetting, setSetting } from '@/shared/db/db'
import { usePlayerRating } from '@/shared/hooks/usePlayerRating'
import { addXp } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'
import type { Puzzle } from '@/shared/chess/puzzle'

interface Cycle { startedAt: number; finishedAt?: number; solved: number; failed: number }
interface WoodpeckerSet { ids: string[]; createdAt: number; cycles: Cycle[] }
const SET_SIZE = 60, CYCLE_XP = 100

/** Woodpecker method: solve the same set repeatedly; each cycle should be faster and more accurate. */
export function WoodpeckerMode({ aside }: { aside: ReactNode }) {
  const rating = usePlayerRating('tactics')
  const set = useLiveQuery(() => getSetting<WoodpeckerSet | null>('woodpecker', null), [])
  const [queue, setQueue] = useState<Puzzle[] | null>(null)
  const [progress, setProgress] = useState({ i: 0, solved: 0, failed: 0, startedAt: 0 })
  const [finished, setFinished] = useState<Cycle | null>(null)
  const show = useToast((t) => t.show)

  const createSet = async () => {
    const pack = await loadPack()
    const lo = rating.rating - 250, hi = rating.rating + 150
    const cands = pack.filter((p) => p.rating >= lo && p.rating <= hi)
    const pool = cands.length >= SET_SIZE ? cands : pack
    const ids = [...pool].sort(() => Math.random() - 0.5).slice(0, SET_SIZE).sort((a, b) => a.rating - b.rating).map((p) => p.id)
    await setSetting('woodpecker', { ids, createdAt: Date.now(), cycles: [] } satisfies WoodpeckerSet)
  }
  const startCycle = async () => {
    if (!set) return
    const pack = await loadPack()
    const byId = new Map(pack.map((p) => [p.id, p]))
    const q = set.ids.map((id) => byId.get(id)).filter((p): p is Puzzle => !!p)
    setQueue(q); setFinished(null); setProgress({ i: 0, solved: 0, failed: 0, startedAt: Date.now() })
  }
  const onResult = (solved: boolean) => {
    setProgress((p) => {
      const n = { ...p, i: p.i + 1, solved: p.solved + (solved ? 1 : 0), failed: p.failed + (solved ? 0 : 1) }
      if (queue && n.i >= queue.length) void completeCycle(n)
      return n
    })
  }
  const completeCycle = async (p: typeof progress) => {
    const cur = await getSetting<WoodpeckerSet | null>('woodpecker', null)
    if (!cur) return
    const cycle: Cycle = { startedAt: p.startedAt, finishedAt: Date.now(), solved: p.solved, failed: p.failed }
    await setSetting('woodpecker', { ...cur, cycles: [...cur.cycles, cycle] })
    await addXp('drill', CYCLE_XP, `woodpecker:${cur.cycles.length + 1}`)
    show(`Cycle ${cur.cycles.length + 1} complete +${CYCLE_XP} XP`)
    setQueue(null); setFinished(cycle)
  }
  const resetSet = async () => { if (confirm('Discard this Woodpecker set and its history?')) { await db.settings.delete('woodpecker'); setQueue(null); setFinished(null) } }
  const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`

  if (queue) {
    return (
      <div className="stack">
        <div className="card flat row" style={{ justifyContent: 'space-between' }}>
          <span className="pill accent mono">Cycle {(set?.cycles.length ?? 0) + 1} · {progress.i}/{queue.length}</span>
          <span className="pill good mono">{progress.solved} ✓</span><span className="pill bad mono">{progress.failed} ✕</span>
          <button className="btn sm ghost" onClick={() => setQueue(null)}>Pause</button>
        </div>
        <div className="progress"><span style={{ width: `${(progress.i / queue.length) * 100}%` }} /></div>
        <PuzzleTrainer mode="woodpecker" options={{ queue, onResult }} autoAdvanceMs={700} aside={aside} />
      </div>
    )
  }
  return (
    <div className="stack">
      <div className="card">
        <h3>The Woodpecker method</h3>
        <p className="muted" style={{ marginTop: 6 }}>Solve the same {SET_SIZE} puzzles in repeated cycles, each cycle faster and more accurate, until the patterns are automatic. Unrated; {CYCLE_XP} XP per completed cycle.</p>
        {finished && <p style={{ marginTop: 8 }}>Cycle done: <strong>{finished.solved}/{finished.solved + finished.failed}</strong> in {fmt((finished.finishedAt ?? 0) - finished.startedAt)}.</p>}
        <div className="row" style={{ marginTop: 10 }}>
          {!set && <button className="btn primary" onClick={createSet}>Create my set (around {Math.round(rating.rating)})</button>}
          {set && <button className="btn primary" onClick={startCycle}>Start cycle {set.cycles.length + 1}</button>}
          {set && <button className="btn ghost" onClick={resetSet}>New set</button>}
        </div>
      </div>
      {set && set.cycles.length > 0 && (
        <div className="card flat">
          <div className="eyebrow">Cycle history</div>
          <table className="table" style={{ marginTop: 6 }}>
            <thead><tr><th>Cycle</th><th className="num">Accuracy</th><th className="num">Time</th><th>Date</th></tr></thead>
            <tbody>{set.cycles.map((c, i) => <tr key={i}><td>{i + 1}</td><td className="num">{Math.round((c.solved / Math.max(1, c.solved + c.failed)) * 100)}%</td><td className="num mono">{fmt((c.finishedAt ?? 0) - c.startedAt)}</td><td className="muted">{new Date(c.startedAt).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {aside}
    </div>
  )
}
