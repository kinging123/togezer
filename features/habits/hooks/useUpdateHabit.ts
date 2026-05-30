import { useMutation } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { habitKeys } from './keys'

type UpdateHabitInput = { id: string; title: string; emoji: string | null }

export function useUpdateHabit() {
  const sb = useSupabase()

  return useMutation({
    mutationFn: async ({ id, title, emoji }: UpdateHabitInput) => {
      const { error } = await sb
        .from('habits')
        .update({ title, emoji })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all() })
    },
  })
}
