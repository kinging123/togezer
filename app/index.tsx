import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'

export default function Guard() {
  const { isSignedIn, isLoaded } = useAuth()
  const { hasHabit, isLoading } = useHasHabit()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && isLoading) return

    if (!isSignedIn) {
      router.replace('/(auth)')
    } else if (!hasHabit) {
      router.replace('/(onboarding)/pick-habit')
    } else {
      router.replace('/(app)')
    }
  }, [isLoaded, isSignedIn, isLoading, hasHabit])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
