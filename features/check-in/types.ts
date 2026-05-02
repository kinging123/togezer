import type { Database } from '@/lib/database.types'

export type CheckIn       = Database['public']['Tables']['check_ins']['Row']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']

export type StreakStatus = {
  streak: number
  graceUsedThisWeek: number
  graceTotalPW: number
  hasCheckedInToday: boolean
}
