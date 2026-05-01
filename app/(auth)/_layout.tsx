import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { router } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { Colors } from '@/constants/theme'

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/')
  }, [isLoaded, isSignedIn])

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
