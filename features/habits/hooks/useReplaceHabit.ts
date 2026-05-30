import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { habitKeys } from './keys'
import { checkInKeys } from '@/features/check-in/hooks/keys'
import type { Habit } from '../types'

type ReplaceHabitInput = { oldHabit: Habit; title: string; emoji: string | null }

// Editing a habit's identity (title/emoji) starts a fresh streak. Rather than
// mutating in place or deleting check-ins, we archive the old habit (preserving
// its history) and create a new one with a fresh created_at — so its streak
// begins at 0. The app shows only the most recent active habit.
export function useReplaceHabit() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async ({ oldHabit, title, emoji }: ReplaceHabitInput) => {
      // Create the replacement first so there is always an active habit.
      const { error: insertError } = await sb.from('habits').insert({
        user_id: userId!,
        title,
        emoji,
        cadence: oldHabit.cadence,
        grace_days_pw: oldHabit.grace_days_pw,
        reminder_time: oldHabit.reminder_time,
      })
      if (insertError) throw insertError

      const { error: archiveError } = await sb
        .from('habits')
        .update({ is_archived: true })
        .eq('id', oldHabit.id)
      if (archiveError) throw archiveError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all() })
      queryClient.invalidateQueries({ queryKey: checkInKeys.all() })
    },
  })
}
