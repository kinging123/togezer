import { useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuth } from '@clerk/expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, ActivityIndicator } from 'react-native'
import { useAcceptInvite } from '@/features/friends/hooks/useAcceptInvite'

export default function InvitePage() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { isSignedIn, isLoaded } = useAuth()
  const { mutateAsync: acceptInvite } = useAcceptInvite()

  useEffect(() => {
    if (!isLoaded || !code) return

    async function handle() {
      if (isSignedIn) {
        try {
          await acceptInvite(code)
        } catch (e) {
          console.warn('invite accept failed', e)
        }
        router.replace('/(app)')
      } else {
        await AsyncStorage.setItem('pendingInvite', code)
        router.replace('/(auth)/sign-up')
      }
    }

    handle()
  }, [isLoaded, isSignedIn, code])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
