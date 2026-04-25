import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { ActivityIndicator, View } from 'react-native'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'

export default function Guard() {
  const { isSignedIn, isLoaded } = useAuth()
  const { hasHabit, isLoading } = useHasHabit()

  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!isSignedIn)  return <Redirect href="/(auth)" />
  if (!hasHabit)    return <Redirect href="/(onboarding)/pick-habit" />
  return <Redirect href="/(app)" />
}
