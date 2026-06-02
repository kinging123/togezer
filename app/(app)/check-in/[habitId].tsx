import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { useHabit } from '@/features/habits/hooks/useHabit'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { CheckInSheet } from '@/features/check-in/components/CheckInSheet'
import { Colors } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'

function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  )
}

function Loaded({ habit }: { habit: Habit }) {
  const { data: status } = useHabitStatus(habit)
  if (!status) return <Loader />
  return <CheckInSheet habit={habit} status={status} />
}

export default function CheckInModal() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  const { data: habit } = useHabit(habitId)
  return (
    <SafeAreaView style={styles.safe}>
      {habit ? <Loaded habit={habit} /> : <Loader />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
