import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'

export function useRegisterPushToken() {
  const sb = useSupabase()
  const { userId, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn || !userId) return

    async function register() {
      if (!Device.isDevice) return

      const { status: existing } = await Notifications.getPermissionsAsync()
      const { status } = existing === 'granted'
        ? { status: existing }
        : await Notifications.requestPermissionsAsync()

      if (status !== 'granted') return

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        })
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync()

      await sb
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId)
    }

    register().catch(console.warn)
  }, [isSignedIn, userId, sb])
}
