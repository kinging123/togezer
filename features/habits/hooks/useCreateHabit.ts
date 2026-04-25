import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import type { HabitInsert } from '../types'
import { habitKeys } from './keys'

export function useCreateHabit() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<HabitInsert, 'user_id'>) => {
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
