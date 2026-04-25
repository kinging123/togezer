import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'

export function useCurrentUser() {
  const sb = useSupabase()
  const { userId, isSignedIn } = useAuth()

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!isSignedIn && !!userId,
  })
}
