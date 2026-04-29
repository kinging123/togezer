# Onboarding Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two onboarding screen stubs with full implementations: `pick-habit` (habit name + preset chips) and `invite` (invite link with copy/share).

**Architecture:** Two independent screens in `app/(onboarding)/`. `pick-habit` calls `useCreateHabit` on submit then navigates to `invite`. `invite` fetches the invite code via `useInviteCode` on mount and offers copy/share actions. No shared state between screens.

**Tech Stack:** Expo Router, React Native, `@tanstack/react-query`, `expo-clipboard`, RN `Share`, existing `useCreateHabit` + `useInviteCode` hooks, `Button` component, design tokens from `constants/theme.ts`.

---

## File Structure

| File | Action |
|------|--------|
| `app/(onboarding)/pick-habit.tsx` | Replace stub |
| `app/(onboarding)/invite.tsx` | Replace stub |
| `__tests__/app/onboarding/pick-habit.test.tsx` | Create |
| `__tests__/app/onboarding/invite.test.tsx` | Create |

---

## Task 1: Install expo-clipboard

**Files:**
- Modify: `package.json` (dependency added by npx expo install)

- [ ] **Step 1: Install the package**

```bash
npx expo install expo-clipboard
```

Expected: package added to `package.json` under `dependencies`.

- [ ] **Step 2: Verify it's available**

```bash
node -e "require('expo-clipboard'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add expo-clipboard"
```

---

## Task 2: pick-habit screen

**Files:**
- Create: `__tests__/app/onboarding/pick-habit.test.tsx`
- Modify: `app/(onboarding)/pick-habit.tsx`

### Context

`useCreateHabit` (at `features/habits/hooks/useCreateHabit.ts`) returns a React Query mutation. The screen calls `mutateAsync({ title, emoji, cadence: 'daily' })`. On success it routes to `/(onboarding)/invite`. On error it shows an inline error string.

`Button` (at `components/Button.tsx`) takes `{ label, onPress, variant, disabled }`. It renders a `Pressable` wrapping a `Text`. When `disabled={true}` the `Pressable` suppresses `onPress` internally, but to be safe the `handleSubmit` function must also guard on `!title.trim()`.

Design tokens used: `Colors`, `Fonts`, `FontSizes`, `Spacing`, `Radii` from `constants/theme.ts`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/onboarding/pick-habit.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import PickHabitScreen from '@/app/(onboarding)/pick-habit'

const mockMutateAsync = jest.fn()
jest.mock('@/features/habits/hooks/useCreateHabit', () => ({
  useCreateHabit: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ router: { push: mockPush } }))

describe('PickHabitScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ id: 'h1', title: 'journal' })
  })

  it('does not submit when title is empty', async () => {
    const { getByText } = render(<PickHabitScreen />)
    fireEvent.press(getByText('next →'))
    await waitFor(() => expect(mockMutateAsync).not.toHaveBeenCalled())
  })

  it('tapping a preset fills the text input', () => {
    const { getByText, getByDisplayValue } = render(<PickHabitScreen />)
    fireEvent.press(getByText('journal'))
    expect(getByDisplayValue('journal')).toBeTruthy()
  })

  it('tapping a second preset replaces the first', () => {
    const { getByText, getByDisplayValue } = render(<PickHabitScreen />)
    fireEvent.press(getByText('move body'))
    fireEvent.press(getByText('journal'))
    expect(getByDisplayValue('journal')).toBeTruthy()
  })

  it('submits with correct args and navigates to invite', async () => {
    const { getByText } = render(<PickHabitScreen />)
    fireEvent.press(getByText('journal'))
    fireEvent.press(getByText('next →'))
    await waitFor(() =>
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'journal',
        emoji: '📓',
        cadence: 'daily',
      })
    )
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/invite')
  })

  it('shows error message when mutation fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('db error'))
    const { getByText, findByText } = render(<PickHabitScreen />)
    fireEvent.press(getByText('journal'))
    fireEvent.press(getByText('next →'))
    expect(await findByText('something went wrong')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/app/onboarding/pick-habit.test.tsx --no-coverage
```

Expected: all 5 tests FAIL (module not found or component renders stub text).

- [ ] **Step 3: Implement pick-habit screen**

Replace the entire contents of `app/(onboarding)/pick-habit.tsx`:

```tsx
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

const PRESETS = [
  { emoji: '🏃', title: 'move body' },
  { emoji: '📖', title: 'read 20 min' },
  { emoji: '📓', title: 'journal' },
  { emoji: '💧', title: 'drink water' },
  { emoji: '🧘', title: 'meditate' },
]

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
    paddingVertical: 11,
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/app/onboarding/pick-habit.test.tsx --no-coverage
```

Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add app/\(onboarding\)/pick-habit.tsx __tests__/app/onboarding/pick-habit.test.tsx
git commit -m "feat: implement pick-habit onboarding screen"
```

---

## Task 3: invite screen

**Files:**
- Create: `__tests__/app/onboarding/invite.test.tsx`
- Modify: `app/(onboarding)/invite.tsx`

### Context

`useInviteCode` (at `features/friends/hooks/useInviteCode.ts`) is a `useQuery` that returns the full DB row. The code string is at `data.code`. Destructure as `{ data, isLoading, isError, refetch }`.

The full invite URL is `https://togezer.vercel.app/j/${data.code}`.

`Clipboard.setStringAsync(url)` from `expo-clipboard` writes to the clipboard.

`Share.share({ message: url })` from `react-native` opens the native share sheet.

Both "continue →" and "skip — go solo" call `router.replace('/(app)')`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/app/onboarding/invite.test.tsx`:

```tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import InviteScreen from '@/app/(onboarding)/invite'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'

const mockSetStringAsync = jest.fn().mockResolvedValue(undefined)
jest.mock('expo-clipboard', () => ({ setStringAsync: mockSetStringAsync }))

const mockShare = jest.fn().mockResolvedValue({ action: 'sharedAction' })
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: { share: mockShare },
}))

jest.mock('@/features/friends/hooks/useInviteCode')
const mockUseInviteCode = useInviteCode as jest.MockedFunction<typeof useInviteCode>

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ router: { replace: mockReplace } }))

const mockRefetch = jest.fn()

describe('InviteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseInviteCode.mockReturnValue({
      data: { code: 'abc1' } as any,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as any)
  })

  it('displays the invite URL', () => {
    const { getByText } = render(<InviteScreen />)
    expect(getByText('togezer.vercel.app/j/abc1')).toBeTruthy()
  })

  it('copy writes full URL to clipboard', async () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('copy'))
    await waitFor(() =>
      expect(mockSetStringAsync).toHaveBeenCalledWith('https://togezer.vercel.app/j/abc1')
    )
  })

  it('share opens native share sheet with full URL', async () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('share →'))
    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({ message: 'https://togezer.vercel.app/j/abc1' })
    )
  })

  it('continue navigates to /(app)', () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('continue →'))
    expect(mockReplace).toHaveBeenCalledWith('/(app)')
  })

  it('skip navigates to /(app)', () => {
    const { getByText } = render(<InviteScreen />)
    fireEvent.press(getByText('skip — go solo'))
    expect(mockReplace).toHaveBeenCalledWith('/(app)')
  })

  it('shows error and retry when useInviteCode fails', () => {
    mockUseInviteCode.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as any)
    const { getByText } = render(<InviteScreen />)
    expect(getByText('failed to load — tap to retry')).toBeTruthy()
    fireEvent.press(getByText('failed to load — tap to retry'))
    expect(mockRefetch).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/app/onboarding/invite.test.tsx --no-coverage
```

Expected: all 6 tests FAIL (stub renders "invite — coming soon", missing modules).

- [ ] **Step 3: Implement the invite screen**

Replace the entire contents of `app/(onboarding)/invite.tsx`:

```tsx
import { useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Button } from '@/components/Button'
import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'

export default function InviteScreen() {
  const { data, isLoading, isError, refetch } = useInviteCode()
  const [copied, setCopied] = useState(false)

  const url = data?.code ? `https://togezer.vercel.app/j/${data.code}` : null
  const displayUrl = data?.code ? `togezer.vercel.app/j/${data.code}` : null

  async function handleCopy() {
    if (!url) return
    await Clipboard.setStringAsync(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (!url) return
    await Share.share({ message: url })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.lbl}>step 2 of 2</Text>
        <Text style={styles.headline}>{'bring the\ngang.'}</Text>
        <Text style={styles.sub}>{"you'll see their streaks. they'll see yours."}</Text>

        <View style={styles.card}>
          <View style={styles.cardLblRow}>
            <Text style={styles.lbl}>your invite link</Text>
            {copied && (
              <View style={styles.copiedBadge}>
                <Text style={styles.copiedText}>copied!</Text>
              </View>
            )}
          </View>

          {isLoading && <Text style={styles.urlText}>generating…</Text>}

          {isError && (
            <Pressable onPress={() => refetch()}>
              <Text style={styles.errorText}>failed to load — tap to retry</Text>
            </Pressable>
          )}

          {!isLoading && !isError && displayUrl && (
            <Text style={styles.urlText} numberOfLines={1}>{displayUrl}</Text>
          )}

          <View style={styles.btnRow}>
            <Pressable
              style={[styles.copyBtn, copied && styles.copyBtnCopied, (isLoading || isError) && styles.btnDisabled]}
              onPress={handleCopy}
              disabled={isLoading || isError}
            >
              <Text style={styles.copyBtnLabel}>{copied ? 'copied ✓' : 'copy'}</Text>
            </Pressable>
            <Pressable
              style={[styles.shareBtn, (isLoading || isError) && styles.btnDisabled]}
              onPress={handleShare}
              disabled={isLoading || isError}
            >
              <Text style={styles.shareBtnLabel}>share →</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>{'drop it in whatsapp, imessage,\nwherever your gang lives'}</Text>
        </View>

        <View style={styles.spacer} />

        <Button
          label="continue →"
          onPress={() => router.replace('/(app)')}
          variant="primary"
          disabled={isLoading}
        />
        <Pressable style={styles.skipBtn} onPress={() => router.replace('/(app)')}>
          <Text style={styles.skipText}>skip — go solo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
  card: {
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.md,
    padding: Spacing.s4,
    backgroundColor: Colors.bg,
    gap: Spacing.s2,
    marginTop: Spacing.s4,
  },
  cardLblRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s2 },
  copiedBadge: {
    backgroundColor: Colors.red,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.s2,
    paddingVertical: 2,
  },
  copiedText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.bg,
  },
  urlText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    borderRadius: Radii.xs,
    paddingVertical: Spacing.s2,
    paddingHorizontal: Spacing.s2,
    backgroundColor: Colors.bg,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.small,
    color: Colors.red,
    letterSpacing: -0.2,
  },
  btnRow: { flexDirection: 'row', gap: Spacing.s2 },
  copyBtn: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.s2,
    alignItems: 'center',
  },
  copyBtnCopied: { backgroundColor: Colors.red },
  copyBtnLabel: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.small,
    color: Colors.bg,
  },
  shareBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.s2,
    alignItems: 'center',
  },
  shareBtnLabel: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: FontSizes.small,
    color: Colors.ink,
  },
  btnDisabled: { opacity: 0.4 },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.ink3,
    lineHeight: 9 * 1.5,
  },
  spacer: { flex: 1 },
  skipBtn: { alignItems: 'center', marginTop: Spacing.s2 },
  skipText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.ink3,
  },
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/app/onboarding/invite.test.tsx --no-coverage
```

Expected: 6/6 PASS.

- [ ] **Step 5: Run full test suite to verify no regressions**

```bash
npx jest --no-coverage
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/\(onboarding\)/invite.tsx __tests__/app/onboarding/invite.test.tsx
git commit -m "feat: implement invite onboarding screen"
```
