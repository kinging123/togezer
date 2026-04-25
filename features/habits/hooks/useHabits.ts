import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHabits() {
  const sb = useSupabase()
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: async () => {
      const { data, error } = await sb
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}
