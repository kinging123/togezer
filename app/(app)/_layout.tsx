import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded || !isSignedIn) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habits/[id]" />
      <Stack.Screen name="check-in/[habitId]" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
