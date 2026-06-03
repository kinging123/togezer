import { View, Text, StyleSheet } from 'react-native'
import { Avatar } from '@/components/Avatar'
import { StreakDots } from '@/components/StreakDots'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'
import type { FriendActivity } from '../types'

export function FriendRow({ activity }: { activity: FriendActivity }) {
  const { profile, habit, status, recentDates } = activity
  return (
    <View style={styles.row}>
      <Avatar id={profile.id} name={profile.display_name} />
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{profile.display_name}</Text>
        <Text style={styles.habit} numberOfLines={1}>{(habit.emoji ?? '✦') + ' ' + habit.title}</Text>
      </View>
      <StreakDots checkedDates={recentDates} />
      <Text testID="today-check" style={styles.check}>
        {status.hasCheckedInToday ? '✅' : '⬜'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s3,
    paddingVertical: Spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  meta: { flex: 1 },
  name: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.small, color: Colors.ink },
  habit: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3 },
  check: { fontSize: 14 },
})
