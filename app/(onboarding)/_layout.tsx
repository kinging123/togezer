import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  // Only block when we're certain the user shouldn't be here.
  // While Clerk is loading, render the Stack so in-flight navigations can land.
  if (isLoaded && !isSignedIn) return null

  return <Stack screenOptions={{ headerShown: false }} />
}
