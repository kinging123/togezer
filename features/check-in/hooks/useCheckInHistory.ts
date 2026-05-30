import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from './keys'

export type CheckInRecord = { checked_date: string; note: string | null }

export function useCheckInHistory(habitId: string) {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery({
    queryKey: checkInKeys.history(habitId),
    queryFn: async () => {
      const { data, error } = await sb
        .from('check_ins')
        .select('checked_date, note')
        .eq('habit_id', habitId)
        .eq('user_id', userId!)
        .order('checked_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as CheckInRecord[]
    },
    enabled: !!habitId && !!userId,
  })
}
