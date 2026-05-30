import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import { useReplaceHabit } from '../hooks/useReplaceHabit'
import { HABIT_PRESETS } from '../presets'
import type { Habit } from '../types'

export function EditHabitForm({ habit, currentStreak }: { habit: Habit; currentStreak: number }) {
  const [title, setTitle] = useState(habit.title)
  const [emoji, setEmoji] = useState<string | null>(habit.emoji)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const { mutateAsync, isPending } = useReplaceHabit()

  const trimmed = title.trim()
  const hasChanges = trimmed !== habit.title || emoji !== habit.emoji
  const willResetStreak = currentStreak > 0

  function handlePresetTap(preset: (typeof HABIT_PRESETS)[number]) {
    setTitle(preset.title)
    setEmoji(preset.emoji)
    setActivePreset(preset.title)
    setConfirming(false)
    setError('')
  }

  function handleTitleChange(text: string) {
    setTitle(text)
    setActivePreset(null)
    setConfirming(false)
    setError('')
  }

  async function commit() {
    setError('')
    try {
      await mutateAsync({ oldHabit: habit, title: trimmed, emoji })
      router.back()
    } catch {
      setError('something went wrong')
    }
  }

  function handleSave() {
    if (!trimmed || isPending) return
    if (!hasChanges) {
      router.back() // nothing changed — leave the streak intact
      return
    }
    if (willResetStreak && !confirming) {
      setConfirming(true) // warn before resetting
      return
    }
    commit()
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <Text style={styles.lbl}>edit habit</Text>
        <Text style={styles.headline}>what are you{'\n'}trying to do?</Text>

        <View style={styles.inputRow}>
          <Text style={styles.emojiSlot}>{emoji ?? '✦'}</Text>
          <TextInput
            testID="title-input"
            style={styles.textInput}
            placeholder="e.g. move body, read more…"
            placeholderTextColor={Colors.ink3}
            autoCapitalize="none"
            value={title}
            onChangeText={handleTitleChange}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={[styles.lbl, { marginTop: Spacing.s4 }]}>or pick a preset</Text>
        <View style={styles.presetList}>
          {HABIT_PRESETS.map((p) => {
            const active = activePreset === p.title
            return (
              <Pressable key={p.title} style={[styles.chip, active && styles.chipActive]} onPress={() => handlePresetTap(p)}>
                <View style={styles.chipLeft}>
                  <Text style={styles.chipEmoji}>{p.emoji}</Text>
                  <Text style={[styles.chipTitle, active && styles.chipTitleActive]}>{p.title}</Text>
                </View>
                <Text style={[styles.chipPlus, active && styles.chipPlusActive]}>{active ? '✓' : '+'}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.spacer} />

        {confirming ? (
          <View style={styles.warnBlock}>
            <Text testID="reset-warning" style={styles.warnText}>
              changing your habit starts fresh — your {currentStreak}-day streak will reset.
            </Text>
            <Button
              label={isPending ? '…' : 'reset & save'}
              onPress={commit}
              variant="primary"
              disabled={isPending}
            />
            <Pressable testID="keep-editing" onPress={() => setConfirming(false)}>
              <Text style={styles.cancel}>keep my streak</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Button
              label={isPending ? '…' : 'save'}
              onPress={handleSave}
              variant="primary"
              disabled={!trimmed || isPending}
            />
            <Pressable testID="edit-cancel" onPress={() => router.back()}>
              <Text style={styles.cancel}>cancel</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.s6, paddingTop: Spacing.s6, paddingBottom: Spacing.s6 },
  lbl: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3, textTransform: 'uppercase', letterSpacing: FontSizes.label * 0.1 },
  headline: { fontFamily: Fonts.display, fontSize: 28, lineHeight: 28 * 1.05, letterSpacing: -(28 * 0.02), color: Colors.ink, marginTop: Spacing.s2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: 11,
    paddingHorizontal: Spacing.s4,
    backgroundColor: Colors.bg,
    marginTop: Spacing.s4,
    gap: Spacing.s2,
  },
  emojiSlot: { fontFamily: Fonts.mono, fontSize: 16, color: Colors.ink3, width: 20, textAlign: 'center' },
  textInput: { flex: 1, fontFamily: Fonts.body, fontSize: FontSizes.body, color: Colors.ink },
  error: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.red, letterSpacing: -0.2, marginTop: Spacing.s1 },
  presetList: { gap: Spacing.s2, marginTop: Spacing.s2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radii.sm,
    paddingVertical: Spacing.s2,
    paddingHorizontal: Spacing.s3,
    backgroundColor: Colors.bg,
  },
  chipActive: { borderColor: Colors.ink, backgroundColor: Colors.ink },
  chipLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  chipEmoji: { fontSize: 16 },
  chipTitle: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.small, color: Colors.ink2 },
  chipTitleActive: { color: Colors.bg },
  chipPlus: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3 },
  chipPlusActive: { color: Colors.bg, opacity: 0.6 },
  spacer: { flex: 1, minHeight: Spacing.s6 },
  cancel: { fontFamily: Fonts.displayMedium, fontSize: FontSizes.small, color: Colors.ink3, textAlign: 'center', marginTop: Spacing.s4 },
  warnBlock: { gap: Spacing.s3 },
  warnText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.redInk,
    letterSpacing: -0.2,
    lineHeight: FontSizes.small * 1.4,
    backgroundColor: Colors.bg2,
    borderWidth: 1.5,
    borderColor: Colors.redInk,
    borderRadius: Radii.md,
    padding: Spacing.s3,
  },
})
