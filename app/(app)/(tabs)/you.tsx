import { SafeAreaView, ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Avatar } from '@/components/Avatar'
import { SignOutButton } from '@/features/auth/components/SignOutButton'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useFriends } from '@/features/friends/hooks/useFriends'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'
import type { Profile } from '@/features/friends/types'

function memberSince(createdAt: string): string {
  return new Date(createdAt)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toLowerCase()
}

export default function YouScreen() {
  const { data: profile, isLoading: profileLoading } = useCurrentUser()
  const { data: habits, isLoading: habitsLoading } = useHabits()
  const habit = habits?.[0]

  if (profileLoading || habitsLoading || !profile || !habit) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    )
  }
  return <YouBody profile={profile} habit={habit} />
}

function YouBody({ profile, habit }: { profile: Profile; habit: Habit }) {
  const { data: status } = useHabitStatus(habit)
  const { data: friends } = useFriends()

  const streak = status?.streak ?? 0
  const graceLeft = status ? Math.max(0, status.graceTotalPW - status.graceUsedThisWeek) : 0
  const friendsCount = friends?.length ?? 0

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>you</Text>

        <View style={styles.profile}>
          <Avatar id={profile.id} name={profile.display_name} size={72} />
          <Text style={styles.name}>{profile.display_name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>
          <Text style={styles.since}>member since {memberSince(profile.created_at)}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={streak} label="day streak" />
          <Stat value={friendsCount} label="friends" />
          <Stat value={graceLeft} label="grace left" />
        </View>

        <Text style={styles.sectionLabel}>your habit</Text>
        <Pressable
          testID="edit-habit"
          style={styles.habitCard}
          onPress={() => router.push(`/edit-habit/${habit.id}`)}
        >
          <Text style={styles.habitEmoji}>{habit.emoji ?? '✦'}</Text>
          <View style={styles.flex}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitStreak}>{streak} day streak</Text>
          </View>
          <Text style={styles.editLabel}>edit</Text>
        </Pressable>

        <View style={styles.spacer} />
        <SignOutButton />
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: Spacing.s6, paddingTop: Spacing.s6, paddingBottom: Spacing.s8 },
  title: { fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink, letterSpacing: -0.4 },
  flex: { flex: 1 },
  spacer: { flex: 1, minHeight: Spacing.s8 },

  profile: { alignItems: 'center', marginTop: Spacing.s6 },
  name: { fontFamily: Fonts.display, fontSize: FontSizes.h2, color: Colors.ink, letterSpacing: -0.9, marginTop: Spacing.s3 },
  username: { fontFamily: Fonts.mono, fontSize: FontSizes.small, color: Colors.ink3, marginTop: Spacing.s1 },
  since: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.ink3, marginTop: Spacing.s2 },

  stats: { flexDirection: 'row', gap: Spacing.s3, marginTop: Spacing.s8 },
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

  sectionLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.ink3, marginTop: Spacing.s8, marginBottom: Spacing.s2 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s3,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.lg,
    padding: Spacing.s4,
    backgroundColor: Colors.bg,
  },
  habitEmoji: { fontSize: 28 },
  habitTitle: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.ink },
  habitStreak: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3, marginTop: 2 },
  editLabel: { fontFamily: Fonts.mono, fontSize: FontSizes.label, textTransform: 'uppercase', letterSpacing: 1, color: Colors.redInk },
})
