import type { Database } from '@/lib/database.types'

export type Profile    = Database['public']['Tables']['profiles']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type InviteCode = Database['public']['Tables']['invite_codes']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
