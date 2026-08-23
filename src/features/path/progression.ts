import type { NodeProgress, PuzzleAttempt } from '@/shared/db/db'
import type { PathNode } from './types'
import { MOTIF_LABEL } from '@/config/themes'

export type NodeState = 'locked' | 'available' | 'in-progress' | 'mastered'

/** Compute the display state of every node from stored progress + puzzle attempts (themed sets are derived, not stored). */
export function nodeStates(nodes: PathNode[], progress: NodeProgress[], attempts: PuzzleAttempt[]): Record<string, { state: NodeState; detail?: string; pct: number }> {
  const byId = new Map(progress.map((p) => [p.nodeId, p]))
  const out: Record<string, { state: NodeState; detail?: string; pct: number }> = {}
  // First pass: intrinsic state ignoring prerequisites
  for (const n of nodes) {
    if (n.kind === 'themed-set' && n.theme && n.target) {
      const rel = attempts.filter((a) => a.themes.includes(n.theme!) && a.hints === 0)
      const recent = rel.slice(0, Math.max(n.target.count, 20))
      const solved = recent.filter((a) => a.solved).length
      const acc = recent.length ? Math.round((solved / recent.length) * 100) : 0
      const mastered = recent.length >= n.target.count && acc >= n.target.accuracy
      out[n.id] = { state: mastered ? 'mastered' : recent.length ? 'in-progress' : 'available', detail: `${Math.min(recent.length, n.target.count)}/${n.target.count} solved${recent.length ? ` · ${acc}%` : ''}`, pct: mastered ? 100 : Math.min(99, Math.round((recent.length / n.target.count) * 100 * (recent.length ? Math.min(1, acc / n.target.accuracy) : 1))) }
    } else {
      const p = byId.get(n.id)
      out[n.id] = { state: p?.status ?? 'available', detail: p ? (p.status === 'mastered' ? 'Mastered' : `${p.score}%`) : undefined, pct: p?.status === 'mastered' ? 100 : p?.score ?? 0 }
    }
  }
  // Second pass: lock anything whose prerequisites are not mastered
  for (const n of nodes) {
    if (out[n.id].state === 'mastered') continue
    const unmet = (n.requires ?? []).filter((r) => out[r]?.state !== 'mastered')
    if (unmet.length) out[n.id] = { ...out[n.id], state: 'locked', detail: `Needs: ${unmet.map((u) => nodes.find((x) => x.id === u)?.title ?? u).join(', ')}` }
  }
  return out
}

export function routeFor(n: PathNode): string {
  switch (n.kind) {
    case 'lesson': return `/path/${n.id}`
    case 'themed-set': return `/puzzles/${n.theme}`
    case 'endgame': return `/play?endgame=${n.endgameId}`
    case 'opening': return `/openings/${n.repertoireId}`
  }
}
export const ICON: Record<PathNode['kind'], string> = { lesson: '📖', 'themed-set': '♞', endgame: '♖', opening: '♙' }

export interface Recommendation { id: string; title: string; route: string; reason: string; xp: number; icon: string }

/** Ranked next steps: due SRS cards › weakest motif › first available path node per track. */
export function nextRecommended(input: { progress: NodeProgress[]; attempts: PuzzleAttempt[]; dueCards: number; nodes: PathNode[] }): Recommendation[] {
  const { progress, attempts, dueCards, nodes } = input
  const states = nodeStates(nodes, progress, attempts)
  const recs: Recommendation[] = []
  if (dueCards > 0) recs.push({ id: 'srs', title: `Review ${dueCards} opening card${dueCards > 1 ? 's' : ''}`, route: '/openings', reason: 'Spaced repetition is due — 5 XP per card.', xp: Math.min(100, dueCards * 5), icon: '♙' })
  // weakest motif over last 100 attempts, min 6 tries
  const recent = attempts.slice(0, 100)
  const byTheme = new Map<string, { n: number; ok: number }>()
  for (const a of recent) for (const t of a.themes) { if (!MOTIF_LABEL[t]) continue; const s = byTheme.get(t) ?? { n: 0, ok: 0 }; s.n++; if (a.solved) s.ok++; byTheme.set(t, s) }
  const weak = [...byTheme.entries()].filter(([, s]) => s.n >= 6).map(([t, s]) => ({ t, pct: s.ok / s.n, n: s.n })).sort((a, b) => a.pct - b.pct)[0]
  if (weak && weak.pct < 0.7) recs.push({ id: 'weak', title: `Themed puzzles: ${MOTIF_LABEL[weak.t]}`, route: `/puzzles/${weak.t}`, reason: `Your weakest motif lately (${Math.round(weak.pct * 100)}% over ${weak.n}).`, xp: 60, icon: '♞' })
  const seenTrack = new Set<string>()
  for (const n of nodes) {
    const st = states[n.id].state
    if (st === 'locked' || st === 'mastered') continue
    if (seenTrack.has(n.track)) continue
    seenTrack.add(n.track)
    recs.push({ id: n.id, title: n.title, route: routeFor(n), reason: st === 'in-progress' ? `In progress · ${states[n.id].detail}` : n.blurb, xp: n.xp, icon: ICON[n.kind] })
  }
  return recs
}
