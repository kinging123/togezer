import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from './keys'

function toLocalDateString() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

export function useTodayStatus(habitId: string) {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery({
    queryKey: [...checkInKeys.todayStatus(), habitId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('check_ins')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', userId!)
        .eq('checked_date', toLocalDateString())
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!habitId && !!userId,
  })
}
