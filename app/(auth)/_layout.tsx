import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { Colors } from '@/constants/theme'

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (isLoaded && isSignedIn) return null

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
