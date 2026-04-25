import { useMutation } from '@tanstack/react-query'
import { useSession } from '@clerk/expo'
import { queryClient } from '@/lib/queryClient'
import { friendKeys } from './keys'

export function useAcceptInvite() {
  const { session } = useSession()

  return useMutation({
    mutationFn: async (code: string) => {
      const token = await session?.getToken({ template: 'supabase' })
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/accept-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'failed to accept invite')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all() })
    },
  })
}
