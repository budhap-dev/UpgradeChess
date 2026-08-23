import { db, DAY_KEY, type XpEvent } from './db'
import { XP, DAILY_GOAL, type XpEventType } from '@/config/scoring'

export async function addXp(type: XpEventType, xp: number, refId?: string): Promise<XpEvent> {
  const ev: XpEvent = { type, xp, refId, ts: Date.now(), day: DAY_KEY() }
  ev.id = await db.xpEvents.add(ev)
  return ev
}

export async function totalXp(): Promise<number> {
  let t = 0
  await db.xpEvents.each((e) => { t += e.xp })
  return t
}

/** Days with any solved puzzle, lesson or drill count toward the streak. */
export async function activeDays(): Promise<Set<string>> {
  const days = new Set<string>()
  await db.xpEvents.where('type').anyOf(['puzzle_solved', 'lesson', 'drill', 'opening_card', 'endgame', 'game_review']).each((e) => days.add(e.day))
  return days
}

export function computeStreak(days: Set<string>, today = DAY_KEY()): number {
  let streak = 0
  const d = new Date(today + 'T00:00:00Z')
  // today may be pending — start counting from today if active, else from yesterday
  if (!days.has(DAY_KEY(d.getTime()))) d.setUTCDate(d.getUTCDate() - 1)
  while (days.has(DAY_KEY(d.getTime()))) { streak++; d.setUTCDate(d.getUTCDate() - 1) }
  return streak
}

export async function todayProgress(): Promise<{ puzzles: number; lessonsOrDrills: number; goalHit: boolean }> {
  const day = DAY_KEY()
  const puzzles = await db.puzzleAttempts.where('day').equals(day).filter((a) => a.solved).count()
  const lessonsOrDrills = await db.xpEvents.where('day').equals(day).filter((e) => e.type === 'lesson' || e.type === 'drill' || e.type === 'endgame').count()
  return { puzzles, lessonsOrDrills, goalHit: puzzles >= DAILY_GOAL.puzzles && lessonsOrDrills >= DAILY_GOAL.lessonsOrDrills }
}

/** Award daily-goal and streak-milestone XP once per day. Returns messages to toast. */
export async function checkDailyAwards(): Promise<string[]> {
  const msgs: string[] = []
  const day = DAY_KEY()
  const p = await todayProgress()
  if (p.goalHit) {
    const already = await db.xpEvents.where('day').equals(day).filter((e) => e.type === 'daily_goal').count()
    if (!already) { await addXp('daily_goal', XP.dailyGoalHit); msgs.push(`Daily goal hit +${XP.dailyGoalHit} XP`) }
  }
  const streak = computeStreak(await activeDays())
  const bonus = XP.streakMilestones[streak]
  if (bonus) {
    const already = await db.xpEvents.filter((e) => e.type === 'streak' && e.refId === String(streak)).count()
    if (!already) { await addXp('streak', bonus, String(streak)); msgs.push(`${streak}-day streak! +${bonus} XP`) }
  }
  return msgs
}
