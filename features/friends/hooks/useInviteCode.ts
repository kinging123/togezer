import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { friendKeys } from './keys'

function generateCode() {
  return Math.random().toString(36).slice(2, 6)
}

export function useInviteCode() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery({
    queryKey: friendKeys.inviteCode(),
    queryFn: async () => {
      const { data: existing } = await sb
        .from('invite_codes')
        .select('*')
        .eq('created_by', userId!)
        .is('accepted_by', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (existing && existing.length > 0) return existing[0]

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await sb
        .from('invite_codes')
        .insert({ code: generateCode(), created_by: userId!, expires_at: expiresAt })
        .select()
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
