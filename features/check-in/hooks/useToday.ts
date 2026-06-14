import { useSyncExternalStore } from 'react'
import { getToday, subscribeToday } from '../lib/today'

// Reactive local calendar day (YYYY-MM-DD). Re-renders consumers when the day
// rolls over at midnight or the app returns to the foreground on a new day.
export function useToday(): string {
  return useSyncExternalStore(subscribeToday, getToday, getToday)
}
