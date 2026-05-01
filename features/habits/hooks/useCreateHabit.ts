import { useMutation } from '@tanstack/react-query'
import { useAuth, useUser } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import type { HabitInsert } from '../types'
import { habitKeys } from './keys'

export function useCreateHabit() {
  const sb = useSupabase()
  const { userId } = useAuth()
  const { user } = useUser()

  return useMutation({
    mutationFn: async (input: Omit<HabitInsert, 'user_id'>) => {
      // Ensure the profile row exists before inserting the habit.
      // ignoreDuplicates makes this a no-op for existing users; it recovers
      // the rare case where handlePostSignUp ran without an auth token.
      if (userId && user) {
        const name = user.fullName ?? user.firstName ?? 'friend'
        const username = name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000)
        await sb.from('profiles').upsert(
          { id: userId, username, display_name: name, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      }

      const { data, error } = await sb
        .from('habits')
        .insert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all() })
    },
  })
}
