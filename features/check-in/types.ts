import type { Database } from '@/lib/database.types'

export type CheckIn       = Database['public']['Tables']['check_ins']['Row']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']
