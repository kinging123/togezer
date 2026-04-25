import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHabit(id: string) {
  const sb = useSupabase()
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await sb
        .from('habits')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
