import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHabits() {
  const sb = useSupabase()
  const { userId } = useAuth()
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: async () => {
      // Filter to the user's own habits. RLS also grants read access to friends'
      // habits, so without this filter the list would include their habits too.
      const { data, error } = await sb
        .from('habits')
        .select('*')
        .eq('user_id', userId!)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
