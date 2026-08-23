import { useLiveQuery } from 'dexie-react-hooks'
import { db, type PlayerRating } from '@/shared/db/db'
import { DEFAULT_GLICKO } from '@/shared/rating/glicko2'

export function usePlayerRating(kind: 'tactics' | 'endgame' = 'tactics'): PlayerRating {
  const r = useLiveQuery(() => db.playerRating.get(kind), [kind])
  return r ?? { kind, ...DEFAULT_GLICKO, updatedAt: 0 }
}
