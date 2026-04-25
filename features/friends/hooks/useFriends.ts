import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { friendKeys } from './keys'

export function useFriends() {
  const sb = useSupabase()
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: async () => {
      const { data, error } = await sb
        .from('friendships')
        .select(`
          id,
          created_at,
          user_a:profiles!friendships_user_a_id_fkey(*),
          user_b:profiles!friendships_user_b_id_fkey(*)
        `)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}
