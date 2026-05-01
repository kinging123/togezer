import { ClerkProvider, useAuth } from '@clerk/expo'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono'
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { tokenCache } from '@/lib/clerk-token-cache'
import { queryClient } from '@/lib/queryClient'
import { SupabaseProvider } from '@/lib/SupabaseProvider'
import { useRegisterPushToken } from '@/features/notifications/hooks/useRegisterPushToken'

SplashScreen.preventAutoHideAsync()

function AppServices() {
  useRegisterPushToken()
  return null
}

// Single source of truth for auth-driven navigation.
// Group layouts guard with `null` to prevent flash but do not navigate —
// only this effect navigates, preventing competing router.replace calls.
function AuthNavigation() {
  const { isSignedIn, isLoaded } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    const inAuth = segments[0] === '(auth)'

    if (!isSignedIn && !inAuth) {
      router.replace('/(auth)')
    } else if (isSignedIn && inAuth) {
      // Let app/index.tsx decide between onboarding and app
      router.replace('/')
    }
  }, [isLoaded, isSignedIn, segments])

  return null
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <AuthNavigation />
          <AppServices />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SupabaseProvider>
    </ClerkProvider>
  )
}
