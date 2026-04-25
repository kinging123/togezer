import { SafeAreaView, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
export default function CheckInModal() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>check in {habitId}</Text></SafeAreaView>
}
