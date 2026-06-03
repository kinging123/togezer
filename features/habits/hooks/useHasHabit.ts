import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHasHabit() {
  const sb = useSupabase()
  const { isSignedIn, userId } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: habitKeys.hasHabit(),
    queryFn: async () => {
      // Own habits only — RLS would otherwise also count friends' habits.
      const { count, error } = await sb
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_archived', false)
      if (error) throw error
      return (count ?? 0) > 0
    },
    enabled: !!isSignedIn && !!userId,
  })

  return {
    hasHabit: data ?? false,
    isLoading: isSignedIn ? isLoading : false,
  }
}
