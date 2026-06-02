import { ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useFriendsActivity } from '@/features/friends/hooks/useFriendsActivity'
import { StreakCard } from '@/features/habits/components/StreakCard'
import { FriendRow } from '@/features/friends/components/FriendRow'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'

function todayLabel(): string {
  return new Date()
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .replace(',', ' ·')
    .toLowerCase()
}

export default function TodayScreen() {
  const { data: habits, isLoading } = useHabits()
  const habit = habits?.[0]
  if (isLoading || !habit) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    )
  }
  return <TodayBody habit={habit} />
}

function TodayBody({ habit }: { habit: Habit }) {
  const { data: status } = useHabitStatus(habit)
  const { data: friends, refetch, isRefetching } = useFriendsActivity()
  const gang = friends ?? []
  const checkedIn = gang.filter((f) => f.status.hasCheckedInToday).length

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <Text style={styles.today}>today</Text>
          <Text style={styles.date}>{todayLabel()}</Text>
        </View>

        {status ? <StreakCard habit={habit} status={status} /> : <ActivityIndicator />}

        <View style={styles.gangHead}>
          <Text style={styles.label}>your gang</Text>
          {gang.length > 0 ? <Text style={styles.counter}>{`${checkedIn} of ${gang.length} in`}</Text> : null}
        </View>

        {gang.length > 0 ? (
          gang.map((f) => <FriendRow key={f.profile.id} activity={f} />)
        ) : (
          <Pressable testID="invite-prompt" style={styles.invite} onPress={() => router.push('/invite-friends')}>
            <Text style={styles.inviteLabel}>bring the gang →</Text>
            <Text style={styles.inviteSub}>habits stick better with friends watching.</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.s6, paddingTop: Spacing.s6, paddingBottom: Spacing.s10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.s4 },
  today: { fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink, letterSpacing: -0.4 },
  date: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.ink3 },
  gangHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.s6, marginBottom: Spacing.s2 },
  label: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.ink3 },
  counter: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.redInk },
  invite: {
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderStyle: 'dashed',
    borderRadius: Radii.md,
    padding: Spacing.s4,
    marginTop: Spacing.s2,
  },
  inviteLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.ink },
  inviteSub: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.ink2, marginTop: Spacing.s1 },
})
