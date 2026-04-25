import { SafeAreaView, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>habit {id}</Text></SafeAreaView>
}
