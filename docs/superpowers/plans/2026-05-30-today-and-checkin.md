# Today Screen & Check-in Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the daily core loop — the Today home screen (my streak ink card + friends "gang" feed) and the tap-to-confirm check-in modal with an inline +1 tick-up.

**Architecture:** Thin screens compose feature components and hooks; no fetch logic in screen files. A new `useFriendsActivity` hook reuses the existing `computeStreakStatus` pure function to derive every friend's streak from RLS-readable data. No backend changes. Reference spec: `docs/superpowers/specs/2026-05-30-today-and-checkin-design.md`.

**Tech Stack:** Expo Router, React Query, Supabase (RLS), Clerk, React Native. Tests: Jest (`testEnvironment: node`) + `@testing-library/react-native`, minimal RN stub at `jest.mocks/react-native.js`.

---

## Conventions (read once)

- Run a single test file: `npx jest <path> -v`. Run all: `npx jest`.
- Test helpers: `__tests__/test-utils.tsx` exports `renderHookWithQuery(hook)`.
- The RN mock (`jest.mocks/react-native.js`) only exports the primitives currently used in tests. **When a component uses a new primitive (e.g. `ScrollView`), add it to the mock first** (Task 1).
- Hooks that need a non-null object (e.g. `useHabitStatus(habit)`) must not be called with `undefined`. Use the **inner-component pattern**: parent guards loading, inner component receives the loaded object and calls the hook unconditionally.
- Commit after each task with the shown message.

---

## File structure

| File | Responsibility |
|---|---|
| `jest.mocks/react-native.js` (modify) | Add `ScrollView`, `ActivityIndicator`, `RefreshControl` stubs |
| `components/StreakDots.tsx` (create) | Shared: last-N-days on/off dots |
| `components/Avatar.tsx` (create) | Shared: colored initial circle, stable color from id |
| `features/friends/types.ts` (modify) | Add `FriendActivity` type |
| `features/friends/hooks/useFriendsActivity.ts` (create) | Friends feed: habits+profiles+check_ins → per-friend status |
| `features/habits/components/StreakCard.tsx` (create) | My ink card + inline check-in CTA |
| `features/friends/components/FriendRow.tsx` (create) | One gang row |
| `features/check-in/components/CheckInSheet.tsx` (create) | Modal body: form → success tick-up |
| `app/(app)/check-in/[habitId].tsx` (modify) | Wire modal to hooks + CheckInSheet |
| `app/(app)/(tabs)/index.tsx` (modify) | Today screen composition |

Tests mirror under `__tests__/`.

---

## Task 1: Extend the RN test mock

**Files:**
- Modify: `jest.mocks/react-native.js`

- [ ] **Step 1: Add ScrollView, ActivityIndicator, RefreshControl stubs**

Add these before `module.exports` and include them in the exports object:

```js
const ScrollView = ({ children, style, testID, refreshControl, ...rest }) =>
  React.createElement('ScrollView', { style, testID, ...rest }, children)

const ActivityIndicator = ({ testID, ...rest }) =>
  React.createElement('ActivityIndicator', { testID, ...rest })

const RefreshControl = ({ refreshing, onRefresh, ...rest }) =>
  React.createElement('RefreshControl', { refreshing, onRefresh, ...rest })
```

Update `module.exports` to add `ScrollView, ActivityIndicator, RefreshControl` to the existing list.

- [ ] **Step 2: Verify existing suite still passes**

Run: `npx jest`
Expected: PASS (28 tests) — no behavior change, only additions.

- [ ] **Step 3: Commit**

```bash
git add jest.mocks/react-native.js
git commit -m "test: add ScrollView/ActivityIndicator/RefreshControl to RN mock"
```

---

## Task 2: StreakDots component

**Files:**
- Create: `components/StreakDots.tsx`
- Test: `__tests__/components/StreakDots.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native'
import { StreakDots } from '@/components/StreakDots'

const today = new Date(2026, 4, 30) // May 30 2026, local

describe('StreakDots', () => {
  it('renders one dot per day, on when checked', () => {
    // last 5 days ending May 30: 26,27,28,29,30
    const { getAllByTestId } = render(
      <StreakDots checkedDates={['2026-05-30', '2026-05-28', '2026-05-26']} days={5} today={today} />
    )
    expect(getAllByTestId('dot-on')).toHaveLength(3)
    expect(getAllByTestId('dot-off')).toHaveLength(2)
  })

  it('defaults to 5 days', () => {
    const { queryAllByTestId } = render(<StreakDots checkedDates={[]} today={today} />)
    expect(queryAllByTestId('dot-off')).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/StreakDots.test.tsx -v`
Expected: FAIL — cannot find module `@/components/StreakDots`.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { View, StyleSheet } from 'react-native'
import { Colors, Spacing, Radii } from '@/constants/theme'

function lastNDates(today: Date, n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    out.push(d.toLocaleDateString('en-CA'))
  }
  return out
}

type Props = { checkedDates: string[]; days?: number; today?: Date }

export function StreakDots({ checkedDates, days = 5, today = new Date() }: Props) {
  const checked = new Set(checkedDates)
  const dates = lastNDates(today, days)
  return (
    <View testID="streak-dots" style={styles.row}>
      {dates.map((d) => {
        const on = checked.has(d)
        return (
          <View
            key={d}
            testID={on ? 'dot-on' : 'dot-off'}
            style={[styles.dot, on ? styles.on : styles.off]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: Radii.pill },
  on: { backgroundColor: Colors.ink },
  off: { backgroundColor: Colors.line },
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/StreakDots.test.tsx -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/StreakDots.tsx __tests__/components/StreakDots.test.tsx
git commit -m "feat: add StreakDots component"
```

---

## Task 3: Avatar component

**Files:**
- Create: `components/Avatar.tsx`
- Test: `__tests__/components/Avatar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native'
import { Avatar, avatarColorForId } from '@/components/Avatar'
import { Colors } from '@/constants/theme'

describe('avatarColorForId', () => {
  it('is stable for the same id', () => {
    expect(avatarColorForId('user_abc')).toBe(avatarColorForId('user_abc'))
  })
  it('returns a palette color', () => {
    expect(Colors.avatarColors).toContain(avatarColorForId('user_xyz'))
  })
})

describe('Avatar', () => {
  it('renders the uppercased first initial', () => {
    const { getByText } = render(<Avatar id="u1" name="maya" />)
    expect(getByText('M')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/Avatar.test.tsx -v`
Expected: FAIL — cannot find module `@/components/Avatar`.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Fonts } from '@/constants/theme'

export function avatarColorForId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return Colors.avatarColors[h % Colors.avatarColors.length]
}

type Props = { id: string; name: string; size?: number }

export function Avatar({ id, name, size = 34 }: Props) {
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  return (
    <View
      testID="avatar"
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColorForId(id) },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  initial: { fontFamily: Fonts.display, color: Colors.ink },
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/Avatar.test.tsx -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/Avatar.tsx __tests__/components/Avatar.test.tsx
git commit -m "feat: add Avatar component with stable id-based color"
```

---

## Task 4: FriendActivity type + useFriendsActivity hook

**Files:**
- Modify: `features/friends/types.ts`
- Create: `features/friends/hooks/useFriendsActivity.ts`
- Test: `__tests__/features/friends/useFriendsActivity.test.tsx`

- [ ] **Step 1: Add the FriendActivity type**

Append to `features/friends/types.ts`:

```ts
import type { StreakStatus } from '@/features/check-in/types'

export type FriendActivity = {
  profile: { id: string; display_name: string; username: string; avatar_url: string | null }
  habit: { id: string; title: string; emoji: string | null }
  status: StreakStatus
  recentDates: string[]
}
```

- [ ] **Step 2: Write the failing test**

```tsx
import { renderHookWithQuery } from '../../test-utils'
import { useFriendsActivity } from '@/features/friends/hooks/useFriendsActivity'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({ useAuth: () => ({ userId: 'me' }) }))

const today = new Date().toLocaleDateString('en-CA')

const rows = [
  {
    id: 'h-zoe', user_id: 'zoe', title: 'meditate', emoji: '🧘',
    created_at: '2026-01-01', grace_days_pw: 1,
    profile: { id: 'zoe', display_name: 'zoe', username: 'zoe', avatar_url: null },
    check_ins: [{ checked_date: today }],
  },
  {
    id: 'h-amy', user_id: 'amy', title: 'run', emoji: '🏃',
    created_at: '2026-01-01', grace_days_pw: 1,
    profile: { id: 'amy', display_name: 'amy', username: 'amy', avatar_url: null },
    check_ins: [],
  },
]

const neq = jest.fn().mockResolvedValue({ data: rows, error: null })
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq,
})

jest.mock('@/lib/SupabaseProvider', () => ({ useSupabase: () => ({ from: mockFrom }) }))

describe('useFriendsActivity', () => {
  it('assembles per-friend status sorted by name and excludes own habit', async () => {
    const { result } = renderHookWithQuery(() => useFriendsActivity())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.map((d) => d.profile.display_name)).toEqual(['amy', 'zoe']) // sorted
    expect(mockFrom).toHaveBeenCalledWith('habits')
    expect(neq).toHaveBeenCalledWith('user_id', 'me')

    const zoe = data.find((d) => d.profile.id === 'zoe')!
    expect(zoe.status.hasCheckedInToday).toBe(true)
    expect(zoe.recentDates).toEqual([today])

    const amy = data.find((d) => d.profile.id === 'amy')!
    expect(amy.status.hasCheckedInToday).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/features/friends/useFriendsActivity.test.tsx -v`
Expected: FAIL — cannot find module `useFriendsActivity`.

- [ ] **Step 4: Write minimal implementation**

```ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from '@/features/check-in/hooks/keys'
import { computeStreakStatus } from '@/features/check-in/lib/computeStreakStatus'
import type { FriendActivity } from '../types'

type Row = {
  id: string
  user_id: string
  title: string
  emoji: string | null
  created_at: string
  grace_days_pw: number
  profile: { id: string; display_name: string; username: string; avatar_url: string | null }
  check_ins: { checked_date: string }[]
}

export function useFriendsActivity() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery<Row[], Error, FriendActivity[]>({
    queryKey: checkInKeys.friendsToday(),
    queryFn: async () => {
      const { data, error } = await sb
        .from('habits')
        .select(
          'id, user_id, title, emoji, created_at, grace_days_pw, ' +
            'profile:profiles!habits_user_id_fkey(id, display_name, username, avatar_url), ' +
            'check_ins(checked_date)'
        )
        .eq('is_archived', false)
        .neq('user_id', userId!)
      if (error) throw error
      return (data ?? []) as unknown as Row[]
    },
    select: (rows) => {
      const today = new Date()
      return rows
        .map<FriendActivity>((r) => ({
          profile: r.profile,
          habit: { id: r.id, title: r.title, emoji: r.emoji },
          status: computeStreakStatus(r.check_ins, r.grace_days_pw, new Date(r.created_at), today),
          recentDates: r.check_ins.map((c) => c.checked_date),
        }))
        .sort((a, b) => a.profile.display_name.localeCompare(b.profile.display_name))
    },
    enabled: !!userId,
  })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/features/friends/useFriendsActivity.test.tsx -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add features/friends/types.ts features/friends/hooks/useFriendsActivity.ts __tests__/features/friends/useFriendsActivity.test.tsx
git commit -m "feat: add useFriendsActivity hook for the gang feed"
```

---

## Task 5: StreakCard component

**Files:**
- Create: `features/habits/components/StreakCard.tsx`
- Test: `__tests__/features/habits/StreakCard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, fireEvent } from '@testing-library/react-native'
import { StreakCard } from '@/features/habits/components/StreakCard'

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))
import { router } from 'expo-router'
const mockPush = router.push as jest.Mock

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}

const baseStatus = { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

describe('StreakCard', () => {
  beforeEach(() => mockPush.mockClear())

  it('shows streak, habit, and a check-in CTA that navigates to the modal', () => {
    const { getByText, getByTestId } = render(<StreakCard habit={habit} status={baseStatus} />)
    expect(getByText('7')).toBeTruthy()
    expect(getByText('read 20 min')).toBeTruthy()
    fireEvent.press(getByTestId('check-in-cta'))
    expect(mockPush).toHaveBeenCalledWith('/check-in/h1')
  })

  it('shows a done state and no CTA when already checked in', () => {
    const { queryByTestId, getByText } = render(
      <StreakCard habit={habit} status={{ ...baseStatus, hasCheckedInToday: true }} />
    )
    expect(queryByTestId('check-in-cta')).toBeNull()
    expect(getByText('checked in ✓')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/features/habits/StreakCard.test.tsx -v`
Expected: FAIL — cannot find module `StreakCard`.

- [ ] **Step 3: Write minimal implementation**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/features/habits/StreakCard.test.tsx -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add features/habits/components/StreakCard.tsx __tests__/features/habits/StreakCard.test.tsx
git commit -m "feat: add StreakCard with inline check-in CTA"
```

---

## Task 6: FriendRow component

**Files:**
- Create: `features/friends/components/FriendRow.tsx`
- Test: `__tests__/features/friends/FriendRow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native'
import { FriendRow } from '@/features/friends/components/FriendRow'
import type { FriendActivity } from '@/features/friends/types'

const activity: FriendActivity = {
  profile: { id: 'zoe', display_name: 'zoe', username: 'zoe', avatar_url: null },
  habit: { id: 'h-zoe', title: 'meditate', emoji: '🧘' },
  status: { streak: 3, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: true },
  recentDates: [],
}

describe('FriendRow', () => {
  it('renders name, habit and a done check when checked in today', () => {
    const { getByText, getByTestId } = render(<FriendRow activity={activity} />)
    expect(getByText('zoe')).toBeTruthy()
    expect(getByText('🧘 meditate')).toBeTruthy()
    expect(getByTestId('today-check').props.children).toBe('✅')
  })

  it('renders an empty box when not checked in today', () => {
    const { getByTestId } = render(
      <FriendRow activity={{ ...activity, status: { ...activity.status, hasCheckedInToday: false } }} />
    )
    expect(getByTestId('today-check').props.children).toBe('⬜')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/features/friends/FriendRow.test.tsx -v`
Expected: FAIL — cannot find module `FriendRow`.

- [ ] **Step 3: Write minimal implementation**

```tsx
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
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.habit}>{(habit.emoji ?? '✦') + ' ' + habit.title}</Text>
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
  meta: { flexShrink: 1 },
  name: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.small, color: Colors.ink },
  habit: { fontFamily: Fonts.mono, fontSize: FontSizes.label, color: Colors.ink3 },
  check: { marginLeft: 'auto', fontSize: 14 },
})
```

Note: `gap` + `marginLeft: 'auto'` push the dots/check to the right; `meta` holds name+habit. The `StreakDots` sits between meta and check.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/features/friends/FriendRow.test.tsx -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add features/friends/components/FriendRow.tsx __tests__/features/friends/FriendRow.test.tsx
git commit -m "feat: add FriendRow for the gang feed"
```

---

## Task 7: CheckInSheet component

**Files:**
- Create: `features/check-in/components/CheckInSheet.tsx`
- Test: `__tests__/features/check-in/CheckInSheet.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { CheckInSheet } from '@/features/check-in/components/CheckInSheet'

const mutateAsync = jest.fn().mockResolvedValue({})
jest.mock('@/features/check-in/hooks/useCheckIn', () => ({
  useCheckIn: () => ({ mutateAsync, isPending: false }),
}))
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }))

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}
const status = { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

describe('CheckInSheet', () => {
  beforeEach(() => { mutateAsync.mockClear(); mutateAsync.mockResolvedValue({}) })

  it('submits with the note and shows the ticked-up streak', async () => {
    const { getByTestId, getByText } = render(<CheckInSheet habit={habit} status={status} />)
    fireEvent.changeText(getByTestId('note-input'), '  did it  ')
    fireEvent.press(getByTestId('confirm'))
    await waitFor(() => expect(getByTestId('checkin-success')).toBeTruthy())
    expect(mutateAsync).toHaveBeenCalledWith({ habitId: 'h1', note: 'did it' })
    expect(getByText('8')).toBeTruthy() // 7 -> 8
  })

  it('treats a 23505 unique violation as already-done success', async () => {
    mutateAsync.mockRejectedValueOnce({ code: '23505' })
    const { getByTestId } = render(<CheckInSheet habit={habit} status={status} />)
    fireEvent.press(getByTestId('confirm'))
    await waitFor(() => expect(getByTestId('checkin-success')).toBeTruthy())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/features/check-in/CheckInSheet.test.tsx -v`
Expected: FAIL — cannot find module `CheckInSheet`.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { useState } from 'react'
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useCheckIn } from '../hooks/useCheckIn'
import { BorderWidths, Colors, Fonts, FontSizes, Radii, Shadows, Spacing } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'
import type { StreakStatus } from '../types'

type Props = { habit: Habit; status: StreakStatus }

export function CheckInSheet({ habit, status }: Props) {
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState<'form' | 'success'>('form')
  const [error, setError] = useState('')
  const { mutateAsync, isPending } = useCheckIn()

  async function handleConfirm() {
    if (isPending) return
    setError('')
    try {
      const trimmed = note.trim()
      await mutateAsync({ habitId: habit.id, note: trimmed || undefined })
      setPhase('success')
    } catch (e: any) {
      if (e?.code === '23505') { setPhase('success'); return }
      setError('something went wrong')
    }
  }

  if (phase === 'success') {
    return (
      <View testID="checkin-success" style={styles.sheet}>
        <View style={styles.checkCirc}><Text style={styles.checkMark}>✓</Text></View>
        <Text style={styles.lbl}>checked in for today</Text>
        <View style={styles.tickRow}>
          <Text style={styles.tickOld}>{status.streak}</Text>
          <Text style={styles.tickNew}>{status.streak + 1}</Text>
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
```

Add `Platform` to the import from `react-native` (used in `confirm` style): the import line must be
`import { View, Text, Pressable, TextInput, Platform, StyleSheet } from 'react-native'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/features/check-in/CheckInSheet.test.tsx -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add features/check-in/components/CheckInSheet.tsx __tests__/features/check-in/CheckInSheet.test.tsx
git commit -m "feat: add CheckInSheet with inline +1 tick-up"
```

---

## Task 8: Wire the check-in modal screen

**Files:**
- Modify: `app/(app)/check-in/[habitId].tsx`

No unit test — thin glue, verified by the manual run in Task 10. Uses the inner-component pattern so `useHabitStatus` is never called with a null habit.

- [ ] **Step 1: Replace the stub**

```tsx
import { View, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useHabit } from '@/features/habits/hooks/useHabit'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { CheckInSheet } from '@/features/check-in/components/CheckInSheet'
import { Colors } from '@/constants/theme'
import type { Habit } from '@/features/habits/types'

function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
    </View>
  )
}

function Loaded({ habit }: { habit: Habit }) {
  const { data: status } = useHabitStatus(habit)
  if (!status) return <Loader />
  return <CheckInSheet habit={habit} status={status} />
}

export default function CheckInModal() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  const { data: habit } = useHabit(habitId)
  return (
    <SafeAreaView style={styles.safe}>
      {habit ? <Loaded habit={habit} /> : <Loader />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
```

- [ ] **Step 2: Verify the suite still passes**

Run: `npx jest`
Expected: PASS (all tests).

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/check-in/[habitId].tsx"
git commit -m "feat: wire check-in modal to CheckInSheet"
```

---

## Task 9: Today screen composition

**Files:**
- Modify: `app/(app)/(tabs)/index.tsx`
- Test: `__tests__/app/today.test.tsx`

Uses the inner-component pattern (`TodayBody` receives the loaded habit).

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from '@testing-library/react-native'

jest.mock('@/features/habits/hooks/useHabits', () => ({ useHabits: jest.fn() }))
jest.mock('@/features/check-in/hooks/useHabitStatus', () => ({ useHabitStatus: jest.fn() }))
jest.mock('@/features/friends/hooks/useFriendsActivity', () => ({ useFriendsActivity: jest.fn() }))
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))

import TodayScreen from '@/app/(app)/(tabs)/index'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useFriendsActivity } from '@/features/friends/hooks/useFriendsActivity'

const mockUseHabits = useHabits as jest.Mock
const mockUseHabitStatus = useHabitStatus as jest.Mock
const mockUseFriends = useFriendsActivity as jest.Mock

const habit = {
  id: 'h1', user_id: 'me', title: 'read 20 min', emoji: '📖', cadence: 'daily',
  reminder_time: null, grace_days_pw: 1, is_archived: false, created_at: '2026-01-01',
}
const status = { streak: 7, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false }

beforeEach(() => {
  mockUseHabits.mockReturnValue({ data: [habit], isLoading: false })
  mockUseHabitStatus.mockReturnValue({ data: status })
  mockUseFriends.mockReturnValue({ data: [], refetch: jest.fn(), isRefetching: false })
})

describe('TodayScreen', () => {
  it('renders my streak card', () => {
    const { getByText } = render(<TodayScreen />)
    expect(getByText('7')).toBeTruthy()
    expect(getByText('read 20 min')).toBeTruthy()
  })

  it('shows the invite prompt when there are no friends', () => {
    const { getByText } = render(<TodayScreen />)
    expect(getByText('bring the gang →')).toBeTruthy()
  })

  it('shows the gang with a checked-in counter', () => {
    mockUseFriends.mockReturnValue({
      data: [
        { profile: { id: 'zoe', display_name: 'zoe', username: 'zoe', avatar_url: null },
          habit: { id: 'hz', title: 'meditate', emoji: '🧘' },
          status: { streak: 3, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: true },
          recentDates: [] },
        { profile: { id: 'amy', display_name: 'amy', username: 'amy', avatar_url: null },
          habit: { id: 'ha', title: 'run', emoji: '🏃' },
          status: { streak: 0, graceUsedThisWeek: 0, graceTotalPW: 1, hasCheckedInToday: false },
          recentDates: [] },
      ],
      refetch: jest.fn(), isRefetching: false,
    })
    const { getByText } = render(<TodayScreen />)
    expect(getByText('zoe')).toBeTruthy()
    expect(getByText('1 of 2 in')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/app/today.test.tsx -v`
Expected: FAIL — current screen renders only `<Text>today</Text>`; assertions fail.

- [ ] **Step 3: Write the implementation**

```tsx
import { SafeAreaView, ScrollView, View, Text, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { useFriendsActivity } from '@/features/friends/hooks/useFriendsActivity'
import { StreakCard } from '@/features/habits/components/StreakCard'
import { FriendRow } from '@/features/friends/components/FriendRow'
import { Colors, Fonts, FontSizes, Spacing } from '@/constants/theme'
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator /></View>
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
    <SafeAreaView style={styles.safe}>
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
          <Pressable style={styles.invite} onPress={() => router.push('/(onboarding)/invite')}>
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
    borderWidth: 1.5, borderColor: Colors.ink, borderStyle: 'dashed', borderRadius: Radii_md(),
    padding: Spacing.s4, marginTop: Spacing.s2,
  },
  inviteLabel: { fontFamily: Fonts.displaySemiBold, fontSize: FontSizes.body, color: Colors.ink },
  inviteSub: { fontFamily: Fonts.body, fontSize: FontSizes.small, color: Colors.ink2, marginTop: Spacing.s1 },
})

function Radii_md() { return 14 }
```

Note: replace `Radii_md()` by importing `Radii` and using `Radii.md` — i.e. add `Radii` to the theme import (`import { Colors, Fonts, FontSizes, Radii, Spacing } from '@/constants/theme'`) and set `borderRadius: Radii.md`. Delete the `Radii_md` helper. (It is written this way only to keep the snippet self-contained; the engineer must use `Radii.md`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/app/today.test.tsx -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/(tabs)/index.tsx" __tests__/app/today.test.tsx
git commit -m "feat: build Today screen with streak card and gang feed"
```

---

## Task 10: Full verification & manual run

**Files:** none (verification only)

- [ ] **Step 1: Run the whole suite**

Run: `npx jest`
Expected: PASS — all suites green (28 prior + new tests).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. Fix any type mismatches (most likely the Supabase nested-select cast in `useFriendsActivity` — the `as unknown as Row[]` handles it).

- [ ] **Step 3: Manual run**

Use the `/run` skill (or `npm run web`) to launch the app. Verify:
1. Today shows the streak ink card with the `check in →` CTA.
2. Tapping the CTA opens the check-in modal; `mark done ✓` shows the green tick-up (7→8) and `nice →` returns to Today.
3. After check-in, the card shows `checked in ✓` (no CTA).
4. With no friends, the `bring the gang →` prompt appears; with friends, rows + the `N of M in` counter render.

- [ ] **Step 4: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: address type-check and manual-run findings for Today/check-in"
```

---

## Self-review notes

- **Spec coverage:** Today layout + states (Tasks 5, 9), check-in modal form+success (Tasks 7, 8), friends feed/`useFriendsActivity` (Task 4), shared `Avatar`/`StreakDots` (Tasks 2, 3), idempotent 23505 handling (Task 7), invite empty-state (Task 9), refresh via RefreshControl (Task 9). Realtime/photo/grace-miss explicitly out of scope.
- **Inner-component pattern** used in Tasks 8 and 9 so `useHabitStatus(habit)` never receives null.
- **Type consistency:** `FriendActivity` defined in Task 4 is consumed unchanged in Tasks 6 and 9; `StreakStatus` shape (`streak`, `graceUsedThisWeek`, `graceTotalPW`, `hasCheckedInToday`) matches `features/check-in/types.ts`; `useCheckIn` input `{ habitId, note? }` matches the existing hook.
