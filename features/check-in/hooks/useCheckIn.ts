import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { checkInKeys } from './keys'
import { habitKeys } from '@/features/habits/hooks/keys'

function toLocalDateString() {
  return new Date().toLocaleDateString('en-CA')
}

type CheckInInput = {
  habitId: string
  photoUrl?: string
  note?: string
}

export function useCheckIn() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async ({ habitId, photoUrl, note }: CheckInInput) => {
      const { data, error } = await sb
        .from('check_ins')
        .insert({
          habit_id: habitId,
          user_id: userId!,
          checked_date: toLocalDateString(),
          type: 'done',
          photo_url: photoUrl ?? null,
          note: note ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.status(habitId) })
      queryClient.invalidateQueries({ queryKey: checkInKeys.friendsToday() })
      queryClient.invalidateQueries({ queryKey: habitKeys.list() })
    },
  })
}
