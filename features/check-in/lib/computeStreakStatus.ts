import type { StreakStatus } from '../types'

// Uses a pending-grace algorithm: missed days are held in a buffer and only
// committed as consumed grace when a subsequent check-in is found on the
// other side. Trailing missed days at the end of the walk are never committed,
// so graceUsedThisWeek reflects grace that actually saved a streak connection.
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
      // graceDaysPW is the max number of *consecutive* days that may be skipped
      // and still keep the streak connected. pendingGrace holds the current run
      // of consecutive misses (it resets to empty on every check-in above), so
      // once it would exceed the budget the streak is broken — regardless of
      // which calendar week the missed days fall in.
      if (pendingGrace.length >= graceDaysPW) {
        break
      }
      pendingGrace.push({ weekKey: getWeekSundayStr(cursor) })
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
