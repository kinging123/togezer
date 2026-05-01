import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded || !isSignedIn) return null

  return <Stack screenOptions={{ headerShown: false }} />
}
