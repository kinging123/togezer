import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from '@/features/check-in/hooks/keys'
import { computeStreakStatus } from '@/features/check-in/lib/computeStreakStatus'
import type { FriendActivity } from '../types'

type Row = {
  id: string
  user_id: string
  title: string
  emoji: string | null
  created_at: string
  grace_days_pw: number
  profile: { id: string; display_name: string; username: string; avatar_url: string | null }
  check_ins: { checked_date: string }[]
}

export function useFriendsActivity() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery<Row[], Error, FriendActivity[]>({
    queryKey: checkInKeys.friendsToday(),
    queryFn: async () => {
      const { data, error } = await sb
        .from('habits')
        .select(
          'id, user_id, title, emoji, created_at, grace_days_pw, ' +
            'profile:profiles!habits_user_id_fkey(id, display_name, username, avatar_url), ' +
            'check_ins(checked_date)'
        )
        .eq('is_archived', false)
        .neq('user_id', userId!)
      if (error) throw error
      return (data ?? []) as unknown as Row[]
    },
    select: (rows) => {
      const today = new Date()
      return rows
        .map<FriendActivity>((r) => ({
          profile: r.profile,
          habit: { id: r.id, title: r.title, emoji: r.emoji },
          status: computeStreakStatus(r.check_ins, r.grace_days_pw, new Date(r.created_at), today),
          recentDates: r.check_ins.map((c) => c.checked_date),
        }))
        .sort((a, b) => a.profile.display_name.localeCompare(b.profile.display_name))
    },
    enabled: !!userId,
  })
}
