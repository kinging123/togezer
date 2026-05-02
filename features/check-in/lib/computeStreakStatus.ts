import type { StreakStatus } from '../types'

export type { StreakStatus }

export function computeStreakStatus(
  checkIns: { checked_date: string }[],
  graceDaysPW: number,
  habitCreatedAt: Date,
  today: Date,
): StreakStatus {
  const todayStr        = toDateStr(today)
  const habitCreatedStr = toDateStr(habitCreatedAt)
  const dateSet         = new Set(checkIns.map(c => c.checked_date))
  const hasCheckedInToday = dateSet.has(todayStr)

  const startStr     = hasCheckedInToday ? todayStr : subtractDay(todayStr)
  const gracePerWeek = new Map<string, number>()
  // pendingGrace tracks missed days that may become grace if a later check-in is found
  const pendingGrace: Array<{ weekKey: string }> = []
  let streak = 0
  let cursor = startStr

  while (cursor >= habitCreatedStr) {
    if (dateSet.has(cursor)) {
      // Commit any pending grace days now that we found a check-in on both sides
      for (const { weekKey } of pendingGrace) {
        const used = gracePerWeek.get(weekKey) ?? 0
        gracePerWeek.set(weekKey, used + 1)
      }
      pendingGrace.length = 0
      streak++
    } else {
      const weekKey = getWeekSundayStr(cursor)
      // Count pending + committed grace for this week to check budget
      const committed  = gracePerWeek.get(weekKey) ?? 0
      const inPending  = pendingGrace.filter(p => p.weekKey === weekKey).length
      const totalUsed  = committed + inPending
      if (totalUsed < graceDaysPW) {
        pendingGrace.push({ weekKey })
      } else {
        break
      }
    }
    cursor = subtractDay(cursor)
  }
  // pendingGrace entries at end of loop are trailing gaps — not consumed

  const thisWeekKey       = getWeekSundayStr(todayStr)
  const graceUsedThisWeek = gracePerWeek.get(thisWeekKey) ?? 0

  return { streak, graceUsedThisWeek, graceTotalPW: graceDaysPW, hasCheckedInToday }
}

function toDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

function subtractDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d - 1).toLocaleDateString('en-CA')
}

function getWeekSundayStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date       = new Date(y, m - 1, d)
  const sunday     = new Date(y, m - 1, d - date.getDay())
  return sunday.toLocaleDateString('en-CA')
}
