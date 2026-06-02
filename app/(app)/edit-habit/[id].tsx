import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { useHabit } from '@/features/habits/hooks/useHabit'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { EditHabitForm } from '@/features/habits/components/EditHabitForm'
import { Colors } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'

function Loaded({ habit }: { habit: Habit }) {
  const { data: status } = useHabitStatus(habit)
  return <EditHabitForm habit={habit} currentStreak={status?.streak ?? 0} />
}

export default function EditHabitModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: habit } = useHabit(id)
  return (
    <SafeAreaView style={styles.safe}>
      {habit ? (
        <Loaded habit={habit} />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
