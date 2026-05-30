import { View, Text, Pressable, Platform, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { BorderWidths, Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'
import type { StreakStatus } from '@/features/check-in/types'

type Props = { habit: Habit; status: StreakStatus }

export function StreakCard({ habit, status }: Props) {
  const graceLeft = Math.max(0, status.graceTotalPW - status.graceUsedThisWeek)
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{habit.emoji ?? '✦'}</Text>
        <Text style={styles.habit}>{habit.title}</Text>
      </View>
      <Text style={styles.num}>{status.streak}</Text>
      <Text style={styles.cap}>day streak</Text>
      <Text style={styles.grace}>◆ {graceLeft} grace left this week</Text>
      {status.hasCheckedInToday ? (
        <View style={styles.done}>
          <Text style={styles.doneLabel}>checked in ✓</Text>
        </View>
      ) : (
        <Pressable testID="check-in-cta" style={styles.cta} onPress={() => router.push(`/check-in/${habit.id}`)}>
          <Text style={styles.ctaLabel}>check in →</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.ink,
    borderRadius: Radii.lg,
    padding: Spacing.s4,
    ...Platform.select({
      web: { boxShadow: `4px 4px 0 0 ${Colors.redInk}` } as object,
      default: { ...Shadows.hard, shadowColor: Colors.redInk },
    }),
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  emoji: { fontSize: 18 },
  habit: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.bg },
  num: { fontFamily: Fonts.display, fontSize: 54, lineHeight: 54 * 0.9, letterSpacing: -2, color: Colors.bg, marginTop: Spacing.s2 },
  cap: { fontFamily: Fonts.mono, fontSize: FontSizes.label, letterSpacing: 1, textTransform: 'uppercase', color: Colors.ink3 },
  grace: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.mint, marginTop: Spacing.s2 },
  cta: {
    backgroundColor: Colors.red,
    borderWidth: BorderWidths.default,
    borderColor: Colors.bg,
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.s4,
  },
  ctaLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.ink },
  done: {
    borderWidth: BorderWidths.default,
    borderColor: Colors.ink3,
    borderStyle: 'dashed',
    borderRadius: Radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: Spacing.s4,
  },
  doneLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.mint },
})
