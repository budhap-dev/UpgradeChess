import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { type Puzzle, uciToMove, isCorrectMove } from '@/shared/chess/puzzle'
import { nextPuzzle } from './puzzleSource'
import { db, DAY_KEY } from '@/shared/db/db'
import { updateGlicko, DEFAULT_GLICKO, PUZZLE_RD } from '@/shared/rating/glicko2'
import { puzzleXp } from '@/config/scoring'
import { addXp, checkDailyAwards } from '@/shared/db/xp'
import { useToast } from '@/shared/ui/toastStore'

export type Mode = 'rated' | 'themed' | 'streak' | 'storm' | 'woodpecker'
export type Status = 'loading' | 'intro' | 'solving' | 'solved' | 'failed' | 'empty'

export interface SessionState {
  puzzle: Puzzle | null
  fen: string
  status: Status
  step: number               // index into solution
  lastMove: { from: string; to: string } | null
  hints: number
  hintSquare: string | null
  ratingDelta: number | null
  xpGained: number | null
  streakCount: number
  wrongSquare: string | null
  startedAt: number
  practice: boolean       // retry after a fail: no rating/XP
}

export interface SessionOptions { queue?: Puzzle[]; onResult?: (solved: boolean, puzzle: Puzzle) => void }

export function usePuzzleSession(mode: Mode, theme: string | undefined, playerRating: number, options: SessionOptions = {}) {
  const chessRef = useRef(new Chess())
  const [s, setS] = useState<SessionState>({ puzzle: null, fen: new Chess().fen(), status: 'loading', step: 0, lastMove: null, hints: 0, hintSquare: null, ratingDelta: null, xpGained: null, streakCount: 0, wrongSquare: null, startedAt: 0, practice: false })
  const streakRef = useRef(0)
  const queueIdx = useRef(0)
  const stormCount = useRef(0)
  const optsRef = useRef(options); optsRef.current = options
  const ratingRef = useRef(playerRating)
  useEffect(() => { ratingRef.current = playerRating }, [playerRating])
  const show = useToast((t) => t.show)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const load = useCallback(async () => {
    setS((p) => ({ ...p, status: 'loading', ratingDelta: null, xpGained: null, hints: 0, hintSquare: null, wrongSquare: null, practice: false }))
    let target = ratingRef.current
    if (mode === 'streak') target = 800 + streakRef.current * 60
    if (mode === 'storm') target = 700 + stormCount.current * 45
    let puzzle: Puzzle | null
    if (mode === 'woodpecker') { const q = optsRef.current.queue ?? []; puzzle = q[queueIdx.current] ?? null; if (!puzzle) { setS((p) => ({ ...p, status: 'empty' })); return } }
    else puzzle = await nextPuzzle({ theme: mode === 'themed' ? theme : undefined, targetRating: target, exclude: mode === 'storm' ? new Set() : undefined })
    if (!puzzle) { setS((p) => ({ ...p, status: 'empty' })); return }
    const chess = new Chess(puzzle.fen)
    chessRef.current = chess
    setS((p) => ({ ...p, puzzle, fen: chess.fen(), status: 'intro', step: 0, lastMove: null, startedAt: Date.now() }))
    later(() => {
      const mv = chess.move(uciToMove(puzzle.opponentMove))
      setS((p) => ({ ...p, fen: chess.fen(), lastMove: mv ? { from: mv.from, to: mv.to } : null, status: 'solving', startedAt: Date.now() }))
    }, 600)
  }, [mode, theme])

  useEffect(() => { void load() }, [load])

  const finish = useCallback(async (solved: boolean, st: SessionState) => {
    const puzzle = st.puzzle!
    const isRated = mode === 'rated' || mode === 'themed'
    const prev = (await db.playerRating.get('tactics')) ?? { kind: 'tactics' as const, ...DEFAULT_GLICKO, updatedAt: 0 }
    let delta: number | null = null
    if (isRated && st.hints === 0) {
      const next = updateGlicko(prev, { rating: puzzle.rating, rd: PUZZLE_RD, vol: 0.06 }, solved ? 1 : 0)
      await db.playerRating.put({ kind: 'tactics', ...next, updatedAt: Date.now() })
      delta = Math.round(next.rating - prev.rating)
    }
    const xp = mode === 'storm' || mode === 'woodpecker' ? 0 : puzzleXp({ solved, puzzleRating: puzzle.rating, playerRating: prev.rating, hints: st.hints })
    await db.puzzleAttempts.add({ puzzleId: puzzle.id, rating: puzzle.rating, solved, timeMs: Date.now() - st.startedAt, hints: st.hints, themes: puzzle.themes, ts: Date.now(), day: DAY_KEY(), ratingAfter: delta == null ? prev.rating : prev.rating + delta })
    if (xp > 0) await addXp(solved ? 'puzzle_solved' : 'puzzle_failed', xp, puzzle.id)
    if (mode === 'streak') { if (solved) streakRef.current += 1; else streakRef.current = 0 }
    if (mode === 'storm' && solved) stormCount.current += 1
    if (mode === 'woodpecker') queueIdx.current += 1
    optsRef.current.onResult?.(solved, puzzle)
    setS((p) => ({ ...p, status: solved ? 'solved' : 'failed', ratingDelta: delta, xpGained: xp, streakCount: streakRef.current }))
    const msgs = await checkDailyAwards()
    msgs.forEach((m, i) => later(() => show(m), 400 + i * 1800))
  }, [mode, show])

  const stateRef = useRef(s)
  useEffect(() => { stateRef.current = s }, [s])

  const onMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    const chess = chessRef.current
    const state = stateRef.current
    if (state.status !== 'solving' || !state.puzzle) return false
    const uci = from + to + (promotion ?? '')
    const expected = state.puzzle.solution[state.step]
    if (!isCorrectMove(chess, uci, expected)) {
      try { const probe = new Chess(chess.fen()); probe.move({ from, to, promotion }) } catch { return false } // illegal: ignore
      const failed = { ...state, wrongSquare: to }
      if (state.practice) setS({ ...failed, status: 'failed' })
      else void finish(false, failed)
      return false
    }
    const mv = chess.move({ from, to, promotion })
    const nextStep = state.step + 1
    const done = nextStep >= state.puzzle.solution.length
    const after: SessionState = { ...state, fen: chess.fen(), lastMove: { from: mv.from, to: mv.to }, step: nextStep, hintSquare: null }
    stateRef.current = after
    setS(after)
    if (done) { if (state.practice) setS({ ...after, status: 'solved' }); else void finish(true, after) }
    else {
      later(() => {
        const reply = chess.move(uciToMove(state.puzzle!.solution[nextStep]))
        setS((p) => ({ ...p, fen: chess.fen(), lastMove: reply ? { from: reply.from, to: reply.to } : null, step: nextStep + 1 }))
      }, 350)
    }
    return true
  }, [finish])

  const hint = useCallback(() => {
    const st = stateRef.current
    if (st.status !== 'solving' || !st.puzzle) return
    const from = st.puzzle.solution[st.step].slice(0, 2)
    setS((p) => ({ ...p, hints: p.hints + 1, hintSquare: from }))
  }, [])

  const showSolution = useCallback(() => {
    const st = stateRef.current
    if (!st.puzzle || st.status !== 'failed') return
    const chess = new Chess(st.puzzle.fen)
    chess.move(uciToMove(st.puzzle.opponentMove))
    let last: { from: string; to: string } | null = null
    for (const u of st.puzzle.solution) { const m = chess.move(uciToMove(u)); if (m) last = { from: m.from, to: m.to } }
    chessRef.current = chess
    setS((p) => ({ ...p, fen: chess.fen(), lastMove: last, wrongSquare: null, step: p.puzzle!.solution.length }))
  }, [])

  const retry = useCallback(() => {
    const st = stateRef.current
    if (!st.puzzle) return
    const chess = new Chess(st.puzzle.fen)
    const mv = chess.move(uciToMove(st.puzzle.opponentMove))
    chessRef.current = chess
    setS((p) => ({ ...p, fen: chess.fen(), lastMove: mv ? { from: mv.from, to: mv.to } : null, status: 'solving', step: 0, wrongSquare: null, practice: true }))
  }, [])

  const restart = useCallback(() => { streakRef.current = 0; queueIdx.current = 0; stormCount.current = 0; setS((p) => ({ ...p, streakCount: 0 })); void load() }, [load])

  return { state: s, onMove, next: load, hint, showSolution, retry, restart }
}
