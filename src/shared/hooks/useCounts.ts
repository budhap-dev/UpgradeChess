import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/db'
import { activeDays, computeStreak, totalXp } from '@/shared/db/xp'

/** Repertoire cards due now (live). Shared by the nav badge and Home. */
export function useDueCards(): number {
  return useLiveQuery(() => db.srsCards.where('due').belowOrEqual(Date.now()).count(), []) ?? 0
}

/** Imported games not yet marked reviewed (live). */
export function useUnreviewedGames(): number {
  return useLiveQuery(() => db.games.filter((g) => !g.reviewed).count(), []) ?? 0
}

export function useTotalXp(): number {
  return useLiveQuery(() => totalXp(), []) ?? 0
}

export function useStreak(): number {
  return useLiveQuery(async () => computeStreak(await activeDays()), []) ?? 0
}
