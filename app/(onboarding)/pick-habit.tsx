import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Button } from '@/components/Button'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import { useCreateHabit } from '@/features/habits/hooks/useCreateHabit'
import { HABIT_PRESETS as PRESETS } from '@/features/habits/presets'

export default function PickHabitScreen() {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [error, setError] = useState('')
  const { mutateAsync, isPending } = useCreateHabit()

  function handlePresetTap(preset: typeof PRESETS[0]) {
    setTitle(preset.title)
    setEmoji(preset.emoji)
    setActivePreset(preset.title)
    setError('')
  }

  function handleTitleChange(text: string) {
    setTitle(text)
    setActivePreset(null)
    setEmoji(null)
    setError('')
  }

  async function handleNext() {
    if (!title.trim() || isPending) return
    setError('')
    try {
      await mutateAsync({ title: title.trim(), emoji, cadence: 'daily' })
      router.push('/(onboarding)/invite')
    } catch {
      setError('something went wrong')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Text style={styles.lbl}>step 1 of 2</Text>
          <Text style={styles.headline}>{'what are you\ntrying to do?'}</Text>
          <Text style={styles.sub}>pick a preset or type your own.</Text>

          <View style={styles.inputRow}>
            <Text style={styles.emojiSlot}>{emoji ?? '✦'}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. move body, read more…"
              placeholderTextColor={Colors.ink3}
              autoCapitalize="none"
              returnKeyType="next"
              value={title}
              onChangeText={handleTitleChange}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={[styles.lbl, { marginTop: Spacing.s2 }]}>or pick a preset</Text>

          <View style={styles.presetList}>
            {PRESETS.map((p) => {
              const active = activePreset === p.title
              return (
                <Pressable
                  key={p.title}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handlePresetTap(p)}
                >
                  <View style={styles.chipLeft}>
                    <Text style={styles.chipEmoji}>{p.emoji}</Text>
                    <Text style={[styles.chipTitle, active && styles.chipTitleActive]}>
                      {p.title}
                    </Text>
                  </View>
                  <Text style={[styles.chipPlus, active && styles.chipPlusActive]}>
                    {active ? '✓' : '+'}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.spacer} />

          <Button
            label={isPending ? '…' : 'next →'}
            onPress={handleNext}
            variant="primary"
            disabled={!title.trim() || isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.s6,
    paddingTop: Spacing.s6,
    paddingBottom: Spacing.s6,
  },
  lbl: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
    textTransform: 'uppercase',
    letterSpacing: FontSizes.label * 0.1,
  },
  headline: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 28 * 1.05,
    letterSpacing: -(28 * 0.02),
    color: Colors.ink,
    marginTop: Spacing.s2,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    color: Colors.ink2,
    lineHeight: FontSizes.body * 1.4,
    letterSpacing: -0.2,
    marginTop: Spacing.s1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: 11, // intentional: matches auth input visual weight
    paddingHorizontal: Spacing.s4,
    backgroundColor: Colors.bg,
    marginTop: Spacing.s3,
    gap: Spacing.s2,
  },
  emojiSlot: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.ink3,
    width: 20,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.body,
    color: Colors.ink,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.red,
    letterSpacing: -0.2,
    marginTop: Spacing.s1,
  },
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
  chipActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  chipLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  chipEmoji: { fontSize: 16 },
  chipTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: FontSizes.small,
    color: Colors.ink2,
  },
  chipTitleActive: { color: Colors.bg },
  chipPlus: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
  },
  chipPlusActive: { color: Colors.bg, opacity: 0.6 },
  spacer: { flex: 1 },
})
