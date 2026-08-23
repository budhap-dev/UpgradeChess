import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getSetting } from '@/shared/db/db'
import { evaluateBadges, type BadgeState } from '@/config/badges'
import { activeDays, computeStreak, totalXp } from '@/shared/db/xp'
import { levelForXp } from '@/config/levels'
import { useToast } from '@/shared/ui/toastStore'

/** Derives badge states from live data and persists newly earned ones (toasting once). */
export function useBadges(): { badges: BadgeState[]; earnedCount: number; ready: boolean } {
  const attempts = useLiveQuery(() => db.puzzleAttempts.toArray(), [])
  const progress = useLiveQuery(() => db.progress.toArray(), [])
  const xp = useLiveQuery(() => totalXp(), [])
  const streak = useLiveQuery(async () => computeStreak(await activeDays()), [])
  const reviewed = useLiveQuery(() => db.games.filter((g) => g.reviewed).count(), [])
  const srsStrong = useLiveQuery(() => db.srsCards.filter((c) => c.reps >= 2).count(), [])
  const stormBest = useLiveQuery(() => getSetting<number>('stormBest', 0), [])
  const wood = useLiveQuery(() => getSetting<{ cycles: unknown[] } | null>('woodpecker', null), [])
  const tactics = useLiveQuery(() => db.playerRating.get('tactics'), [])
  const stored = useLiveQuery(() => db.badges.toArray(), [])
  const show = useToast((t) => t.show)
  const ready = [attempts, progress, xp, streak, reviewed, srsStrong, stormBest, stored].every((v) => v !== undefined)

  const badges = useMemo(() => {
    if (!ready) return []
    return evaluateBadges({
      attempts: attempts!, streak: streak!, level: levelForXp(xp!).level, gamesReviewed: reviewed!,
      mastered: new Set(progress!.filter((p) => p.status === 'mastered').map((p) => p.nodeId)),
      srsStrong: srsStrong!, stormBest: stormBest ?? 0, woodpeckerCycles: wood?.cycles.length ?? 0, tacticsRating: tactics?.rating ?? 1500,
    })
  }, [ready, attempts, streak, xp, reviewed, progress, srsStrong, stormBest, wood, tactics])

  useEffect(() => {
    if (!ready) return
    const have = new Set((stored ?? []).map((b) => b.badgeId))
    const fresh = badges.filter((b) => b.earned && !have.has(b.def.id))
    if (!fresh.length) return
    void (async () => {
      for (const b of fresh) await db.badges.put({ badgeId: b.def.id, earnedAt: Date.now() })
      fresh.slice(0, 3).forEach((b, i) => setTimeout(() => show(`Badge earned: ${b.def.icon} ${b.def.title}`), 300 + i * 1800))
    })()
  }, [badges, stored, ready, show])

  return { badges, earnedCount: badges.filter((b) => b.earned).length, ready }
}
