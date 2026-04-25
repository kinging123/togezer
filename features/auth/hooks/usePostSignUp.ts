import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useAuth, useSession } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'

export function usePostSignUp() {
  const sb = useSupabase()
  const { userId } = useAuth()
  const { session } = useSession()

  async function handlePostSignUp(displayName: string) {
    // 1. Create profile row (username defaults to display name — user can edit later)
    const username = displayName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000)
    const { error } = await sb.from('profiles').insert({
      id: userId!,
      username,
      display_name: displayName,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    if (error) throw error

    // 2. Invalidate profile cache
    queryClient.invalidateQueries({ queryKey: ['profile', userId] })

    // 3. Check for a pending invite (stored before sign-up redirect)
    const pendingCode = await AsyncStorage.getItem('pendingInvite')
    if (pendingCode) {
      try {
        const token = await session?.getToken({ template: 'supabase' })
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/accept-invite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ code: pendingCode }),
          }
        )
        if (!res.ok) console.warn('invite accept failed silently', await res.text())
      } catch (e) {
        console.warn('invite accept failed silently', e)
      }
      await AsyncStorage.removeItem('pendingInvite')
    }

    // 4. Continue to onboarding
    router.replace('/(onboarding)/pick-habit')
  }

  return { handlePostSignUp }
}
