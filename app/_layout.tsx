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
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { tokenCache } from '@/lib/clerk-token-cache'
import { queryClient } from '@/lib/queryClient'
import { SupabaseProvider } from '@/lib/SupabaseProvider'
import { useRegisterPushToken } from '@/features/notifications/hooks/useRegisterPushToken'
import { useNotificationObserver } from '@/features/notifications/hooks/useNotificationObserver'
import { useToday } from '@/features/check-in/hooks/useToday'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'

SplashScreen.preventAutoHideAsync()

function AppServices() {
  useRegisterPushToken()
  useNotificationObserver()
  // Subscribe app-wide so the day-rollover watcher starts and refreshes
  // streak/"today" data when the local date changes while the app is open.
  useToday()
  return null
}

// Single source of truth for auth-driven navigation.
// Navigates directly to the final destination — never routes through "/"
// because router.replace('/') from within the (auth) stack resolves to
// (auth)/index.tsx (groups are transparent in URL space), not app/index.tsx.
function AuthNavigation() {
  const { isSignedIn, isLoaded } = useAuth()
  const { hasHabit, isLoading: habitLoading } = useHasHabit()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    const inAuth       = segments[0] === '(auth)'
    const inOnboarding = segments[0] === '(onboarding)'
    const inApp        = segments[0] === '(app)'

    if (!isSignedIn && (inOnboarding || inApp)) {
      router.replace('/(auth)')
      return
    }

    if (isSignedIn && inAuth) {
      if (habitLoading) return
      router.replace(hasHabit ? '/(app)' : '/(onboarding)/pick-habit')
    }
  }, [isLoaded, isSignedIn, segments, hasHabit, habitLoading])

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
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  )
}
