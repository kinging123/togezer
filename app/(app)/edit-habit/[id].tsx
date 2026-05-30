import { View, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useHabit } from '@/features/habits/hooks/useHabit'
import { EditHabitForm } from '@/features/habits/components/EditHabitForm'
import { Colors } from '@/constants/theme'

export default function EditHabitModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: habit } = useHabit(id)
  return (
    <SafeAreaView style={styles.safe}>
      {habit ? (
        <EditHabitForm habit={habit} />
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
