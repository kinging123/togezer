import { useEffect } from 'react'
import { AppState } from 'react-native'
import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { queryClient } from '@/lib/queryClient'
import { checkInKeys } from '@/features/check-in/hooks/keys'

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        queryClient.invalidateQueries({ queryKey: checkInKeys.all() })
      }
    })
    return () => sub.remove()
  }, [])

  if (isLoaded && !isSignedIn) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habits/[id]" />
      <Stack.Screen name="check-in/[habitId]" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
