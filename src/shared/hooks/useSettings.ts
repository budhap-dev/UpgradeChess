import { useLiveQuery } from 'dexie-react-hooks'
import { db, setSetting } from '@/shared/db/db'

export interface Settings {
  lichessUser: string; chesscomUser: string; theme: 'system' | 'light' | 'dark'; boardFlipAuto: boolean; onboarded: boolean
  boardTheme: string; pieceSet: string; showCoordinates: boolean; animations: boolean; sounds: boolean; haptics: boolean
}
export const DEFAULT_SETTINGS: Settings = {
  lichessUser: '', chesscomUser: '', theme: 'system', boardFlipAuto: true, onboarded: false,
  boardTheme: 'tournament', pieceSet: 'default', showCoordinates: true, animations: true, sounds: true, haptics: true,
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => Promise<void>] {
  const rows = useLiveQuery(() => db.settings.toArray(), [])
  const settings: Settings = { ...DEFAULT_SETTINGS }
  for (const r of rows ?? []) if (r.key in settings) (settings as unknown as Record<string, unknown>)[r.key] = r.value
  const update = async (patch: Partial<Settings>) => { for (const [k, v] of Object.entries(patch)) await setSetting(k, v) }
  return [settings, update]
}
