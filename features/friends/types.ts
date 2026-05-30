import type { Database } from '@/lib/database.types'
import type { StreakStatus } from '@/features/check-in/types'

export type Profile    = Database['public']['Tables']['profiles']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type InviteCode = Database['public']['Tables']['invite_codes']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type FriendActivity = {
  profile: { id: string; display_name: string; username: string; avatar_url: string | null }
  habit: { id: string; title: string; emoji: string | null }
  status: StreakStatus
  recentDates: string[]
}
