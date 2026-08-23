import Dexie, { type EntityTable } from 'dexie'
import type { XpEventType } from '@/config/scoring'

export interface XpEvent { id?: number; type: XpEventType; xp: number; refId?: string; ts: number; day: string }
export interface PuzzleAttempt { id?: number; puzzleId: string; rating: number; solved: boolean; timeMs: number; hints: number; themes: string[]; ts: number; day: string; ratingAfter: number }
export interface PlayerRating { kind: 'tactics' | 'endgame'; rating: number; rd: number; vol: number; updatedAt: number }
export interface ExternalRating { id?: number; platform: 'lichess' | 'chesscom'; perf: string; rating: number; rd?: number; games?: number; ts: number; day: string }
export interface NodeProgress { nodeId: string; status: 'available' | 'in-progress' | 'mastered'; score: number; attempts: number; lastAt: number }
export interface SrsCard { id: string; repertoireId: string; fen: string; move: string; san: string; ease: number; interval: number; reps: number; due: number }
export interface Setting { key: string; value: unknown }
export interface Badge { badgeId: string; earnedAt: number }
export type ErrorCategory = 'opening' | 'tactic' | 'plan' | 'endgame'
export interface GameError { ply: number; san: string; best: string; bestSan: string; fenBefore: string; lossPct: number; severity: 'inaccuracy' | 'mistake' | 'blunder'; category: ErrorCategory; evalBefore: number; evalAfter: number }
export interface MoveEval { ply: number; san: string; cp: number; mate?: number; best: string }  // cp from White's perspective, after the move
export interface StoredGame {
  id: string; source: 'lichess' | 'chesscom' | 'pgn'; url?: string
  white: string; black: string; whiteRating?: number; blackRating?: number; result: '1-0' | '0-1' | '1/2-1/2' | '*'
  speed: string; playedAt: number; opening?: string; moves: string  // SAN moves, space-separated
  userColor: 'w' | 'b'
  analysed: boolean; reviewed: boolean; evals?: MoveEval[]; errors?: GameError[]
  summary?: { acpl: number; inaccuracies: number; mistakes: number; blunders: number }
}

export const DAY_KEY = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10)

class UpgradeChessDB extends Dexie {
  xpEvents!: EntityTable<XpEvent, 'id'>
  puzzleAttempts!: EntityTable<PuzzleAttempt, 'id'>
  playerRating!: EntityTable<PlayerRating, 'kind'>
  externalRatings!: EntityTable<ExternalRating, 'id'>
  progress!: EntityTable<NodeProgress, 'nodeId'>
  srsCards!: EntityTable<SrsCard, 'id'>
  settings!: EntityTable<Setting, 'key'>
  badges!: EntityTable<Badge, 'badgeId'>
  games!: EntityTable<StoredGame, 'id'>
  constructor() {
    super('upgradechess')
    this.version(1).stores({
      xpEvents: '++id, type, ts, day',
      puzzleAttempts: '++id, puzzleId, ts, day, solved, *themes',
      playerRating: 'kind',
      externalRatings: '++id, [platform+perf], day, ts',
      progress: 'nodeId, status',
      srsCards: 'id, repertoireId, due',
      settings: 'key',
      badges: 'badgeId',
    })
    this.version(2).stores({ games: 'id, source, playedAt, analysed, reviewed' })
  }
}
export const db = new UpgradeChessDB()

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await db.settings.get(key)
  return (s?.value as T) ?? fallback
}
export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value })
}
