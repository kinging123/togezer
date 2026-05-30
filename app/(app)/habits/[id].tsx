import { SafeAreaView, ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useHabit } from '@/features/habits/hooks/useHabit'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useCheckInHistory } from '@/features/check-in/hooks/useCheckInHistory'
import { ContributionGrid } from '@/features/check-in/components/ContributionGrid'
import { thisWeekCount } from '@/features/check-in/lib/historyStats'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function Loaded({ habit }: { habit: Habit }) {
  const { data: status } = useHabitStatus(habit)
  const { data: history } = useCheckInHistory(habit.id)
  const dates = (history ?? []).map((h) => h.checked_date)
  const streak = status?.streak ?? 0

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable testID="back" onPress={() => router.back()}>
          <Text style={styles.back}>← back</Text>
        </Pressable>
        <Pressable testID="edit" onPress={() => router.push(`/edit-habit/${habit.id}`)}>
          <Text style={styles.edit}>edit</Text>
        </Pressable>
      </View>

      <View style={styles.head}>
        <Text style={styles.emoji}>{habit.emoji ?? '✦'}</Text>
        <Text style={styles.title}>{habit.title}</Text>
      </View>

      <View style={styles.stats}>
        <Stat value={streak} label="day streak" />
        <Stat value={dates.length} label="check-ins" />
        <Stat value={thisWeekCount(dates)} label="this week" />
      </View>

      <Text style={styles.sectionLabel}>last 13 weeks</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ContributionGrid checkedDates={dates} />
      </ScrollView>
    </ScrollView>
  )
}

export default function HabitDetailScreen() {
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
  content: { paddingHorizontal: Spacing.s6, paddingTop: Spacing.s4, paddingBottom: Spacing.s10 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.s4 },
  back: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.small, color: Colors.ink2 },
  edit: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.redInk },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s3 },
  emoji: { fontSize: 32 },
  title: { fontFamily: Fonts.display, fontSize: FontSizes.h2, color: Colors.ink, letterSpacing: -0.9, flexShrink: 1 },
  stats: { flexDirection: 'row', gap: Spacing.s3, marginTop: Spacing.s6 },
  statTile: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s4,
    backgroundColor: Colors.bg2,
  },
  statValue: { fontFamily: Fonts.display, fontSize: FontSizes.h2, color: Colors.ink, letterSpacing: -0.9 },
  statLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.ink3, marginTop: Spacing.s1 },
  sectionLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.ink3, marginTop: Spacing.s8, marginBottom: Spacing.s3 },
})
