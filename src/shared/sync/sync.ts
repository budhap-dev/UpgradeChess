/**
 * Cloud sync: the whole local database is stored as one JSON document per user (table `user_data`, RLS-protected).
 * Merge is a union by stable keys so two devices can both add progress; scalar tables are last-write-wins by timestamp.
 */
import Dexie from 'dexie'
import { db, type XpEvent, type PuzzleAttempt, type PlayerRating, type ExternalRating, type NodeProgress, type SrsCard, type Setting, type Badge, type StoredGame } from '@/shared/db/db'
import { supabase } from './supabase'

export interface Dump {
  v: 1; exportedAt: number
  xpEvents: XpEvent[]; puzzleAttempts: PuzzleAttempt[]; playerRating: PlayerRating[]; externalRatings: ExternalRating[]
  progress: NodeProgress[]; srsCards: SrsCard[]; settings: Setting[]; badges: Badge[]; games: StoredGame[]
}
const LOCAL_ONLY_SETTINGS = new Set(['syncLastAt'])

export async function dumpLocal(): Promise<Dump> {
  const [xpEvents, puzzleAttempts, playerRating, externalRatings, progress, srsCards, settings, badges, games] = await Promise.all([
    db.xpEvents.toArray(), db.puzzleAttempts.toArray(), db.playerRating.toArray(), db.externalRatings.toArray(), db.progress.toArray(), db.srsCards.toArray(), db.settings.toArray(), db.badges.toArray(), db.games.toArray(),
  ])
  return { v: 1, exportedAt: Date.now(), xpEvents, puzzleAttempts, playerRating, externalRatings, progress, srsCards, settings: settings.filter((s) => !LOCAL_ONLY_SETTINGS.has(s.key)), badges, games }
}

const unionBy = <T>(a: T[], b: T[], key: (t: T) => string, prefer?: (x: T, y: T) => T): T[] => {
  const m = new Map<string, T>()
  for (const t of a) m.set(key(t), t)
  for (const t of b) { const k = key(t); const cur = m.get(k); m.set(k, cur && prefer ? prefer(cur, t) : cur ?? t) }
  return [...m.values()]
}
const newer = <T extends { updatedAt?: number; lastAt?: number; ts?: number; due?: number; earnedAt?: number }>(x: T, y: T) => {
  const tx = x.updatedAt ?? x.lastAt ?? x.ts ?? x.due ?? x.earnedAt ?? 0, ty = y.updatedAt ?? y.lastAt ?? y.ts ?? y.due ?? y.earnedAt ?? 0
  return ty > tx ? y : x
}

/** Pure merge of two dumps. Exported for tests. */
export function mergeDumps(local: Dump, remote: Dump): Dump {
  const strip = <T extends { id?: number }>(rows: T[]) => rows.map(({ id: _id, ...r }) => r as T) // drop auto-increment ids
  const xpEvents = unionBy(strip(local.xpEvents), strip(remote.xpEvents), (e) => `${e.type}|${e.refId ?? ''}|${e.ts}`)
  const puzzleAttempts = unionBy(strip(local.puzzleAttempts), strip(remote.puzzleAttempts), (a) => `${a.puzzleId}|${a.ts}`)
  const externalRatings = unionBy(strip(local.externalRatings), strip(remote.externalRatings), (r) => `${r.platform}|${r.perf}|${r.day}`, newer)
  const playerRating = unionBy(local.playerRating, remote.playerRating, (r) => r.kind, newer)
  const progress = unionBy(local.progress, remote.progress, (p) => p.nodeId, (x, y) => (x.status === 'mastered' && y.status !== 'mastered' ? x : y.status === 'mastered' && x.status !== 'mastered' ? y : newer(x, y)))
  const srsCards = unionBy(local.srsCards, remote.srsCards, (c) => c.id, (x, y) => (y.reps > x.reps ? y : x.reps > y.reps ? x : newer(x, y)))
  const badges = unionBy(local.badges, remote.badges, (b) => b.badgeId, (x, y) => (x.earnedAt <= y.earnedAt ? x : y))
  const games = unionBy(local.games, remote.games, (g) => g.id, (x, y) => (x.reviewed && !y.reviewed ? x : y.reviewed && !x.reviewed ? y : x.analysed && !y.analysed ? x : y.analysed && !x.analysed ? y : x))
  const newerDump = remote.exportedAt > local.exportedAt ? remote : local
  const olderDump = newerDump === remote ? local : remote
  const settings = unionBy(olderDump.settings, newerDump.settings, (s) => s.key, (_x, y) => y)
  return { v: 1, exportedAt: Math.max(local.exportedAt, remote.exportedAt), xpEvents, puzzleAttempts, playerRating, externalRatings, progress, srsCards, settings, badges, games }
}

export async function applyDump(d: Dump) {
  await db.transaction('rw', [db.xpEvents, db.puzzleAttempts, db.playerRating, db.externalRatings, db.progress, db.srsCards, db.settings, db.badges, db.games], async () => {
    await Promise.all([db.xpEvents.clear(), db.puzzleAttempts.clear(), db.playerRating.clear(), db.externalRatings.clear(), db.progress.clear(), db.srsCards.clear(), db.badges.clear(), db.games.clear()])
    await db.xpEvents.bulkAdd(d.xpEvents.map(({ id: _i, ...r }) => r as XpEvent))
    await db.puzzleAttempts.bulkAdd(d.puzzleAttempts.map(({ id: _i, ...r }) => r as PuzzleAttempt))
    await db.playerRating.bulkPut(d.playerRating)
    await db.externalRatings.bulkAdd(d.externalRatings.map(({ id: _i, ...r }) => r as ExternalRating))
    await db.progress.bulkPut(d.progress); await db.srsCards.bulkPut(d.srsCards); await db.badges.bulkPut(d.badges); await db.games.bulkPut(d.games)
    for (const s of d.settings) if (!LOCAL_ONLY_SETTINGS.has(s.key)) await db.settings.put(s)
  })
}

export async function fetchRemote(userId: string): Promise<Dump | null> {
  const sb = supabase(); if (!sb) return null
  const { data, error } = await sb.from('user_data').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.data as Dump | undefined) ?? null
}
export async function pushRemote(userId: string, d: Dump) {
  const sb = supabase(); if (!sb) return
  const { error } = await sb.from('user_data').upsert({ user_id: userId, data: d, updated_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  await db.settings.put({ key: 'syncLastAt', value: Date.now() })
}

/** Full two-way sync: merge remote+local, write both sides. */
export async function syncNow(userId: string): Promise<{ merged: boolean }> {
  const local = await dumpLocal()
  const remote = await fetchRemote(userId)
  if (!remote) { await pushRemote(userId, local); return { merged: false } }
  const merged = mergeDumps(local, remote)
  await applyDump(merged)
  await pushRemote(userId, merged)
  return { merged: true }
}

/** Push local changes (debounced) whenever the local DB mutates while signed in. */
let pushTimer: ReturnType<typeof setTimeout> | undefined
let paused = false
export function startAutoPush(getUserId: () => string | null, onStatus?: (s: 'pending' | 'synced' | 'error', msg?: string) => void) {
  const handler = () => {
    const uid = getUserId(); if (!uid || paused) return
    onStatus?.('pending'); clearTimeout(pushTimer)
    pushTimer = setTimeout(async () => { try { await pushRemote(uid, await dumpLocal()); onStatus?.('synced') } catch (e) { onStatus?.('error', (e as Error).message) } }, 4000)
  }
  Dexie.on('storagemutated', handler)
  return () => { Dexie.on('storagemutated').unsubscribe(handler); clearTimeout(pushTimer) }
}
export function pauseAutoPush(v: boolean) { paused = v }
