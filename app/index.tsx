import { useAuth } from '@clerk/expo'
import { Redirect } from 'expo-router'
import { View } from 'react-native'
import { Colors } from '@/constants/theme'

export default function Root() {
  const { isSignedIn, isLoaded } = useAuth()

  // Hold on the brand background while Clerk initialises — seamless, no flash
  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.bg }} />
  }

  // TODO: redirect signed-in users to /(app) once that group has real screens
  if (isSignedIn) return <Redirect href="/(app)" />

  return <Redirect href="/(auth)" />
}
