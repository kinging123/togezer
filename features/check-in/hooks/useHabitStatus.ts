import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from './keys'
import { computeStreakStatus } from '../lib/computeStreakStatus'
import type { StreakStatus } from '../types'
import type { Habit } from '@/features/habits/types'

export function useHabitStatus(habit: Habit) {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery<{ checked_date: string }[], Error, StreakStatus>({
    queryKey: checkInKeys.status(habit.id),
    queryFn: async () => {
      const { data, error } = await sb
        .from('check_ins')
        .select('checked_date')
        .eq('habit_id', habit.id)
        .eq('user_id', userId!)
        .gte('checked_date', habit.created_at.slice(0, 10))
        .order('checked_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    select: (checkIns) =>
      computeStreakStatus(
        checkIns,
        habit.grace_days_pw,
        new Date(habit.created_at),
        new Date(),
      ),
    enabled: !!habit.id && !!userId,
  })
}
