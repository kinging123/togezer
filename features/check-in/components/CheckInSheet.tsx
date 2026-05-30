import { useState } from 'react'
import { View, Text, Pressable, TextInput, Platform, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useCheckIn } from '../hooks/useCheckIn'
import { BorderWidths, Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'
import type { StreakStatus } from '../types'

type Props = { habit: Habit; status: StreakStatus }

export function CheckInSheet({ habit, status }: Props) {
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState<'form' | 'success'>('form')
  // Snapshot of the streak after today's check-in, captured at confirm time.
  // We can't read status.streak in the success view: useCheckIn invalidates the
  // status query, so by the time success renders the live value has already
  // advanced — showing e.g. 1→2 instead of 0→1.
  const [newStreak, setNewStreak] = useState(0)
  const [error, setError] = useState('')
  const { mutateAsync, isPending } = useCheckIn()

  async function handleConfirm() {
    if (isPending) return
    setError('')
    // status reflects pre-check-in state here (today not yet counted unless this
    // is the rare already-checked-in race), so this resolves to today's streak.
    const streakWithToday = status.hasCheckedInToday ? status.streak : status.streak + 1
    try {
      const trimmed = note.trim()
      await mutateAsync({ habitId: habit.id, note: trimmed || undefined })
      setNewStreak(streakWithToday)
      setPhase('success')
    } catch (e: any) {
      if (e?.code === '23505') {
        setNewStreak(streakWithToday)
        setPhase('success')
        return
      }
      setError('something went wrong')
    }
  }

  if (phase === 'success') {
    return (
      <View testID="checkin-success" style={styles.sheet}>
        <View style={styles.checkCirc}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.lbl}>checked in for today</Text>
        <View style={styles.tickRow}>
          <Text style={styles.tickOld}>{newStreak - 1}</Text>
          <Text style={styles.tickNew}>{newStreak}</Text>
        </View>
        <Text style={styles.cap}>{'day streak · ' + habit.title}</Text>
        <Pressable testID="success-dismiss" style={styles.confirm} onPress={() => router.back()}>
          <Text style={styles.confirmLabel}>nice →</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.emoji}>{habit.emoji ?? '✦'}</Text>
      <Text style={styles.lbl}>checking in</Text>
      <Text style={styles.title}>{habit.title}</Text>
      <TextInput
        testID="note-input"
        style={styles.note}
        placeholder="add a note… (optional)"
        placeholderTextColor={Colors.ink3}
        value={note}
        onChangeText={setNote}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable testID="confirm" style={styles.confirm} onPress={handleConfirm} disabled={isPending}>
        <Text style={styles.confirmLabel}>{isPending ? '…' : 'mark done ✓'}</Text>
      </Pressable>
      <Pressable testID="cancel" onPress={() => router.back()}>
        <Text style={styles.cancel}>not yet</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { padding: Spacing.s5, alignItems: 'center' },
  emoji: { fontSize: 40 },
  lbl: { fontFamily: Fonts.mono, fontSize: FontSizes.label, letterSpacing: 1, textTransform: 'uppercase', color: Colors.ink3, marginTop: Spacing.s2 },
  title: { fontFamily: Fonts.display, fontSize: FontSizes.h2, color: Colors.ink, letterSpacing: -0.6, marginTop: Spacing.s1 },
  note: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderColor: Colors.ink3,
    borderStyle: 'dashed',
    borderRadius: Radii.md,
    paddingVertical: 11,
    paddingHorizontal: Spacing.s3,
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    color: Colors.ink,
    marginTop: Spacing.s5,
  },
  error: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.red, marginTop: Spacing.s2 },
  confirm: {
    alignSelf: 'stretch',
    backgroundColor: Colors.red,
    borderWidth: BorderWidths.default,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.s5,
    ...Platform.select({ web: { boxShadow: `3px 3px 0 0 ${Colors.ink}` } as object, default: Shadows.hardSm }),
  },
  confirmLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.ink },
  cancel: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.small, color: Colors.ink3, marginTop: Spacing.s4 },
  checkCirc: {
    width: 72, height: 72, borderRadius: Radii.pill, backgroundColor: Colors.mint,
    borderWidth: BorderWidths.default, borderColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.s3,
  },
  checkMark: { fontSize: 36 },
  tickRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.s2, marginTop: Spacing.s1 },
  tickOld: { fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink3, textDecorationLine: 'line-through' },
  tickNew: { fontFamily: Fonts.display, fontSize: 40, color: Colors.ink, letterSpacing: -1 },
  cap: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3, marginTop: Spacing.s1 },
})
