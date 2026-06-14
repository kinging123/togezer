import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'

export function useRegisterPushToken() {
  const sb = useSupabase()
  const { userId, isSignedIn } = useAuth()

  useEffect(() => {
    if (Platform.OS === 'web') return
    if (!isSignedIn || !userId) return

    async function register() {
      const Constants = (await import('expo-constants')).default
      // Expo Go (SDK 53+) dropped remote push notifications; attempting to
      // register a push token there throws a noisy dev error. Skip it — real
      // push works in a development/standalone build.
      if (Constants.executionEnvironment === 'storeClient') return

      const Device = await import('expo-device')
      const Notifications = await import('expo-notifications')

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

      // projectId is required to resolve a token in dev/standalone builds.
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId

      const { data: token } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )

      await sb
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId!) // guarded by the early return above
    }

    register().catch(console.warn)
  }, [isSignedIn, userId, sb])
}
