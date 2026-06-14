import { AppState } from 'react-native'
import { queryClient } from '@/lib/queryClient'
import { checkInKeys } from '../hooks/keys'
import { habitKeys } from '@/features/habits/hooks/keys'

// All "today"/streak math is device-local (single-timezone MVP). This store is
// the one place that watches for the local calendar day changing — either at
// midnight while the app stays open, or when it returns to the foreground on a
// new day — and refreshes everything that was computed against the old date.

export function localDateStr(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA')
}

let currentDay = localDateStr()
const listeners = new Set<() => void>()

// Recompute the local day; if it changed, invalidate the date-dependent queries
// so they recompute against the new date, and notify subscribers. Returns
// whether the day actually rolled over. Exported for testing.
export function refreshIfDayChanged(): boolean {
  const next = localDateStr()
  if (next === currentDay) return false
  currentDay = next
  // checkInKeys.all() === ['check-ins'] prefix-matches status / friends-today /
  // history — every query whose result depends on "today".
  queryClient.invalidateQueries({ queryKey: checkInKeys.all() })
  queryClient.invalidateQueries({ queryKey: habitKeys.list() })
  listeners.forEach((l) => l())
  return true
}

let started = false
let midnightTimer: ReturnType<typeof setTimeout> | undefined

function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

function scheduleMidnight(): void {
  if (midnightTimer) clearTimeout(midnightTimer)
  midnightTimer = setTimeout(() => {
    refreshIfDayChanged()
    scheduleMidnight()
  }, msUntilNextMidnight())
  // Don't keep a Node process (e.g. the Jest worker) alive just for this timer.
  ;(midnightTimer as { unref?: () => void }).unref?.()
}

function start(): void {
  if (started) return
  started = true
  AppState.addEventListener('change', (state) => {
    if (state === 'active') refreshIfDayChanged()
  })
  scheduleMidnight()
}

export function getToday(): string {
  return currentDay
}

export function subscribeToday(listener: () => void): () => void {
  start()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
