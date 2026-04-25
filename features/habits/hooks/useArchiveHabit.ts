import { useMutation } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { habitKeys } from './keys'

export function useArchiveHabit() {
  const sb = useSupabase()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb
        .from('habits')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all() })
    },
  })
}
