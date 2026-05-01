import AsyncStorage from '@react-native-async-storage/async-storage'
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
    const { error } = await sb.from('profiles').upsert(
      {
        id: userId!,
        username,
        display_name: displayName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    // On web, clerk.session.getToken() may return null immediately after
    // setActive() while the session token is still being fetched — the upsert
    // runs without auth and gets a 403. Don't throw: useCreateHabit upserts
    // the profile as a safety net once the session is fully ready.
    if (error) {
      console.warn('[handlePostSignUp] profile upsert deferred:', error.code)
      return
    }

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

    // Navigation is handled by the routing guard in app/index.tsx —
    // once isSignedIn=true and !hasHabit it redirects to pick-habit.
  }

  return { handlePostSignUp }
}
