import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { Colors } from '@/constants/theme'

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  // Return null while Clerk loads or if already signed in —
  // AuthNavigation in the root layout handles the redirect.
  if (!isLoaded || isSignedIn) return null

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    />
  )
}
