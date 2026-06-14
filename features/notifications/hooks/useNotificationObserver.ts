import { useEffect } from 'react'
import { Platform } from 'react-native'
import { router } from 'expo-router'

type NotificationData = {
  type?: 'reminder' | 'friend_checkin'
  habitId?: string
}

// Route a tapped notification to the relevant screen.
function handleResponse(data: NotificationData) {
  if (data.type === 'reminder' && data.habitId) {
    router.push(`/(app)/check-in/${data.habitId}`)
    return
  }
  if (data.type === 'friend_checkin') {
    router.push('/(app)/(tabs)')
  }
}

/**
 * Display notifications while the app is foregrounded and route taps to the
 * right screen (including a tap that cold-launched the app).
 */
export function useNotificationObserver() {
  useEffect(() => {
    if (Platform.OS === 'web') return

    let subscription: { remove: () => void } | undefined
    let cancelled = false

    async function setup() {
      const Notifications = await import('expo-notifications')

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      })

      // App launched by tapping a notification.
      const last = await Notifications.getLastNotificationResponseAsync()
      if (last) {
        handleResponse(last.notification.request.content.data as NotificationData)
      }

      if (cancelled) return

      // Taps while the app is running.
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        handleResponse(response.notification.request.content.data as NotificationData)
      })
    }

    setup().catch(console.warn)

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])
}
