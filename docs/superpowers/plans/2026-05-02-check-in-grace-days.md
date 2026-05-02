# Check-in & Grace Days Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement client-side streak + grace day computation, replacing the stub `useTodayStatus` hook with a full `useHabitStatus` hook backed by a pure `computeStreakStatus` function.

**Architecture:** Grace days are passive and inferred — never stored in the DB. A pure `computeStreakStatus(checkIns, graceDaysPW, habitCreatedAt, today)` function walks backward through `done` check-ins, absorbing missed days as grace when the Sun–Sat weekly budget allows. A `useHabitStatus` hook fetches all check-ins since habit creation and passes them to the compute function, returning a `StreakStatus` object. The `app/(app)/_layout.tsx` shell invalidates the cache on app foreground to catch midnight rollovers.

**Tech Stack:** TypeScript, React Query (`@tanstack/react-query`), Supabase (`@supabase/supabase-js`), React Native `AppState`, Jest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/003_checkin_type_done_only.sql` | Create | Drop `'grace'` from `check_ins.type` constraint |
| `features/check-in/types.ts` | Modify | Add `StreakStatus` type |
| `features/check-in/lib/computeStreakStatus.ts` | Create | Pure streak + grace computation |
| `__tests__/features/check-in/computeStreakStatus.test.ts` | Create | Unit tests for the pure function |
| `features/check-in/hooks/keys.ts` | Modify | Replace `todayStatus()` with `status(habitId)` |
| `features/check-in/hooks/useCheckIn.ts` | Modify | Remove `type` from input, hardcode `'done'` |
| `features/check-in/hooks/useHabitStatus.ts` | Create | React Query hook wrapping the compute function |
| `__tests__/features/check-in/useHabitStatus.test.tsx` | Create | Hook integration test |
| `features/check-in/hooks/useTodayStatus.ts` | Delete | Superseded by `useHabitStatus` |
| `app/(app)/_layout.tsx` | Modify | Add `AppState` listener to invalidate on foreground |

---

## Task 1: DB Migration — drop `'grace'` from type constraint

**Files:**
- Create: `supabase/migrations/003_checkin_type_done_only.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Drop the inline CHECK constraint Postgres auto-named at table creation
ALTER TABLE check_ins DROP CONSTRAINT IF EXISTS check_ins_type_check;
-- Re-add allowing only 'done' — grace is inferred, never stored
ALTER TABLE check_ins ADD CONSTRAINT check_ins_type_check CHECK (type IN ('done'));
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/003_checkin_type_done_only.sql
git commit -m "feat: restrict check_ins.type to done only — grace is inferred"
```

---

## Task 2: Foundation — `StreakStatus` type + cache key rename

**Files:**
- Modify: `features/check-in/types.ts`
- Modify: `features/check-in/hooks/keys.ts`

- [ ] **Step 1: Add `StreakStatus` to `features/check-in/types.ts`**

Replace the full file content:

```typescript
import type { Database } from '@/lib/database.types'

export type CheckIn       = Database['public']['Tables']['check_ins']['Row']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']

export type StreakStatus = {
  streak: number
  graceUsedThisWeek: number
  graceTotalPW: number
  hasCheckedInToday: boolean
}
```

- [ ] **Step 2: Replace `todayStatus` key with `status(habitId)` in `features/check-in/hooks/keys.ts`**

Replace the full file content:

```typescript
export const checkInKeys = {
  all:          ()                => ['check-ins']                        as const,
  status:       (habitId: string) => ['check-ins', 'status', habitId]    as const,
  friendsToday: ()                => ['check-ins', 'friends-today']       as const,
  history:      (habitId: string) => ['check-ins', 'history', habitId]   as const,
}
```

- [ ] **Step 3: Commit**

```bash
git add features/check-in/types.ts features/check-in/hooks/keys.ts
git commit -m "feat: add StreakStatus type and rename check-in cache key"
```

---

## Task 3: Pure Compute Function (TDD)

**Files:**
- Create: `__tests__/features/check-in/computeStreakStatus.test.ts`
- Create: `features/check-in/lib/computeStreakStatus.ts`

All tests use `today = new Date(2026, 4, 2)` (2026-05-02, a Saturday).
Current Sun–Sat week: 2026-04-26 → 2026-05-02.
Previous week: 2026-04-19 → 2026-04-25.

- [ ] **Step 1: Create the test file**

Create `__tests__/features/check-in/computeStreakStatus.test.ts`:

```typescript
import { computeStreakStatus } from '@/features/check-in/lib/computeStreakStatus'

const TODAY      = new Date(2026, 4, 2)  // 2026-05-02, Saturday
const CREATED_AT = new Date(2026, 3, 1)  // 2026-04-01, well before all test dates

describe('computeStreakStatus', () => {
  it('returns zero streak when there are no check-ins', () => {
    const result = computeStreakStatus([], 1, CREATED_AT, TODAY)
    expect(result).toEqual({
      streak: 0,
      hasCheckedInToday: false,
      graceUsedThisWeek: 0,
      graceTotalPW: 1,
    })
  })

  it('counts a single check-in today', () => {
    const result = computeStreakStatus(
      [{ checked_date: '2026-05-02' }],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result).toEqual({
      streak: 1,
      hasCheckedInToday: true,
      graceUsedThisWeek: 0,
      graceTotalPW: 1,
    })
  })

  it('counts consecutive check-ins not including today', () => {
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
        { checked_date: '2026-04-29' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result).toEqual({
      streak: 3,
      hasCheckedInToday: false,
      graceUsedThisWeek: 0,
      graceTotalPW: 1,
    })
  })

  it('absorbs a single missed day with a grace day', () => {
    // checked in today and 2 days ago, missed yesterday — grace covers it
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-04-30' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(2)
    expect(result.hasCheckedInToday).toBe(true)
    expect(result.graceUsedThisWeek).toBe(1)
  })

  it('breaks the streak when grace is exhausted', () => {
    // missed yesterday AND 2 days ago; only 1 grace/week
    // walk: today=done(1), yesterday=miss(grace used→1), 04-30=miss(grace exhausted→break)
    const result = computeStreakStatus(
      [{ checked_date: '2026-05-02' }],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(1)
    expect(result.graceUsedThisWeek).toBe(1)
  })

  it('does not count grace days toward the streak number', () => {
    // 4 done check-ins with one grace gap in the middle
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        // missed 2026-04-30 — grace covers it
        { checked_date: '2026-04-29' },
        { checked_date: '2026-04-28' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(4)
    expect(result.graceUsedThisWeek).toBe(1)
  })

  it('grace in a previous week does not consume this week\'s budget', () => {
    // missed 2026-04-25 (previous week), all of current week done
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
        { checked_date: '2026-04-29' },
        { checked_date: '2026-04-28' },
        { checked_date: '2026-04-27' },
        { checked_date: '2026-04-26' },
        // missed 2026-04-25 — in previous week, grace covers it
        { checked_date: '2026-04-24' },
      ],
      1,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(8)
    expect(result.graceUsedThisWeek).toBe(0)
  })

  it('stops counting at habit creation date', () => {
    // habit created 2026-04-30, only two check-ins possible
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        { checked_date: '2026-05-01' },
        { checked_date: '2026-04-30' },
      ],
      1,
      new Date(2026, 3, 30), // habitCreatedAt = 2026-04-30
      TODAY,
    )
    expect(result.streak).toBe(3)
  })

  it('returns zero streak when graceDaysPW is 0 and a day is missed', () => {
    const result = computeStreakStatus(
      [
        { checked_date: '2026-05-02' },
        // missed yesterday
        { checked_date: '2026-04-30' },
      ],
      0,
      CREATED_AT,
      TODAY,
    )
    expect(result.streak).toBe(1)
    expect(result.graceUsedThisWeek).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they all fail**

```bash
npx jest __tests__/features/check-in/computeStreakStatus.test.ts --no-coverage
```

Expected: all tests fail with `Cannot find module '@/features/check-in/lib/computeStreakStatus'`

- [ ] **Step 3: Create the directory and implement the function**

Create `features/check-in/lib/computeStreakStatus.ts`:

```typescript
import type { StreakStatus } from '../types'

export { StreakStatus }

export function computeStreakStatus(
  checkIns: { checked_date: string }[],
  graceDaysPW: number,
  habitCreatedAt: Date,
  today: Date,
): StreakStatus {
  const todayStr       = toDateStr(today)
  const habitCreatedStr = toDateStr(habitCreatedAt)
  const dateSet        = new Set(checkIns.map(c => c.checked_date))
  const hasCheckedInToday = dateSet.has(todayStr)

  const startStr   = hasCheckedInToday ? todayStr : subtractDay(todayStr)
  const gracePerWeek = new Map<string, number>()
  let streak = 0
  let cursor = startStr

  while (cursor >= habitCreatedStr) {
    if (dateSet.has(cursor)) {
      streak++
    } else {
      const weekKey = getWeekSundayStr(cursor)
      const used    = gracePerWeek.get(weekKey) ?? 0
      if (used < graceDaysPW) {
        gracePerWeek.set(weekKey, used + 1)
      } else {
        break
      }
    }
    cursor = subtractDay(cursor)
  }

  const thisWeekKey    = getWeekSundayStr(todayStr)
  const graceUsedThisWeek = gracePerWeek.get(thisWeekKey) ?? 0

  return { streak, graceUsedThisWeek, graceTotalPW: graceDaysPW, hasCheckedInToday }
}

function toDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA')
}

function subtractDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d - 1).toLocaleDateString('en-CA')
}

function getWeekSundayStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date      = new Date(y, m - 1, d)
  const sunday    = new Date(y, m - 1, d - date.getDay())
  return sunday.toLocaleDateString('en-CA')
}
```

- [ ] **Step 4: Run tests to verify they all pass**

```bash
npx jest __tests__/features/check-in/computeStreakStatus.test.ts --no-coverage
```

Expected: all 9 tests pass

- [ ] **Step 5: Commit**

```bash
git add features/check-in/lib/computeStreakStatus.ts __tests__/features/check-in/computeStreakStatus.test.ts
git commit -m "feat: add computeStreakStatus pure function with tests"
```

---

## Task 4: `useHabitStatus` Hook

**Files:**
- Create: `features/check-in/hooks/useHabitStatus.ts`
- Create: `__tests__/features/check-in/useHabitStatus.test.tsx`
- Delete: `features/check-in/hooks/useTodayStatus.ts`

- [ ] **Step 1: Write the failing hook test**

Create `__tests__/features/check-in/useHabitStatus.test.tsx`:

```typescript
import { renderHookWithQuery } from '../../test-utils'
import { useHabitStatus } from '@/features/check-in/hooks/useHabitStatus'
import { waitFor } from '@testing-library/react-native'
import type { Habit } from '@/features/habits/types'

const mockHabit: Habit = {
  id: 'h1',
  title: 'meditate',
  user_id: 'u1',
  cadence: 'daily',
  emoji: null,
  reminder_time: null,
  grace_days_pw: 1,
  is_archived: false,
  created_at: '2026-04-28T00:00:00.000Z',
}

const mockCheckIns = [
  { checked_date: '2026-05-01' },
  { checked_date: '2026-04-30' },
  { checked_date: '2026-04-29' },
]

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  gte:    jest.fn().mockReturnThis(),
  order:  jest.fn().mockResolvedValue({ data: mockCheckIns, error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ userId: 'u1' }),
}))

describe('useHabitStatus', () => {
  it('fetches check_ins and returns a StreakStatus', async () => {
    const { result } = renderHookWithQuery(() => useHabitStatus(mockHabit))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toMatchObject({
      streak: expect.any(Number),
      hasCheckedInToday: expect.any(Boolean),
      graceUsedThisWeek: expect.any(Number),
      graceTotalPW: 1,
    })
    expect(mockFrom).toHaveBeenCalledWith('check_ins')
  })

  it('returns streak 0 and hasCheckedInToday false when no check-ins', async () => {
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      gte:    jest.fn().mockReturnThis(),
      order:  jest.fn().mockResolvedValue({ data: [], error: null }),
    })
    const { result } = renderHookWithQuery(() => useHabitStatus(mockHabit))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.streak).toBe(0)
    expect(result.current.data?.hasCheckedInToday).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/features/check-in/useHabitStatus.test.tsx --no-coverage
```

Expected: fail with `Cannot find module '@/features/check-in/hooks/useHabitStatus'`

- [ ] **Step 3: Implement the hook**

Create `features/check-in/hooks/useHabitStatus.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from './keys'
import { computeStreakStatus } from '../lib/computeStreakStatus'
import type { StreakStatus } from '../types'
import type { Habit } from '@/features/habits/types'

export function useHabitStatus(habit: Habit) {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery<{ checked_date: string }[], Error, StreakStatus>({
    queryKey: checkInKeys.status(habit.id),
    queryFn: async () => {
      const { data, error } = await sb
        .from('check_ins')
        .select('checked_date')
        .eq('habit_id', habit.id)
        .eq('user_id', userId!)
        .gte('checked_date', habit.created_at.slice(0, 10))
        .order('checked_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    select: (checkIns) =>
      computeStreakStatus(
        checkIns,
        habit.grace_days_pw,
        new Date(habit.created_at),
        new Date(),
      ),
    enabled: !!habit.id && !!userId,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/features/check-in/useHabitStatus.test.tsx --no-coverage
```

Expected: 2 tests pass

- [ ] **Step 5: Delete `useTodayStatus.ts`**

```bash
rm features/check-in/hooks/useTodayStatus.ts
```

- [ ] **Step 6: Run full test suite to verify nothing broke**

```bash
npm test -- --no-coverage
```

Expected: all tests pass (no references to `useTodayStatus` exist in other test files)

- [ ] **Step 7: Commit**

```bash
git add features/check-in/hooks/useHabitStatus.ts __tests__/features/check-in/useHabitStatus.test.tsx
git rm features/check-in/hooks/useTodayStatus.ts
git commit -m "feat: add useHabitStatus hook, remove useTodayStatus"
```

---

## Task 5: Simplify `useCheckIn`

**Files:**
- Modify: `features/check-in/hooks/useCheckIn.ts`

- [ ] **Step 1: Update `useCheckIn.ts`**

Replace the full file content:

```typescript
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { checkInKeys } from './keys'
import { habitKeys } from '@/features/habits/hooks/keys'

function toLocalDateString() {
  return new Date().toLocaleDateString('en-CA')
}

type CheckInInput = {
  habitId: string
  photoUrl?: string
  note?: string
}

export function useCheckIn() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async ({ habitId, photoUrl, note }: CheckInInput) => {
      const { data, error } = await sb
        .from('check_ins')
        .insert({
          habit_id: habitId,
          user_id: userId!,
          checked_date: toLocalDateString(),
          type: 'done',
          photo_url: photoUrl ?? null,
          note: note ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.status(habitId) })
      queryClient.invalidateQueries({ queryKey: checkInKeys.friendsToday() })
      queryClient.invalidateQueries({ queryKey: habitKeys.list() })
    },
  })
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --no-coverage
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add features/check-in/hooks/useCheckIn.ts
git commit -m "feat: simplify useCheckIn — hardcode type done, remove grace input"
```

---

## Task 6: AppState Listener for Cache Invalidation

**Files:**
- Modify: `app/(app)/_layout.tsx`

- [ ] **Step 1: Update `app/(app)/_layout.tsx`**

Replace the full file content:

```typescript
import { useEffect } from 'react'
import { AppState } from 'react-native'
import { Stack } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { queryClient } from '@/lib/queryClient'
import { checkInKeys } from '@/features/check-in/hooks/keys'

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        queryClient.invalidateQueries({ queryKey: checkInKeys.all() })
      }
    })
    return () => sub.remove()
  }, [])

  if (isLoaded && !isSignedIn) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habits/[id]" />
      <Stack.Screen name="check-in/[habitId]" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --no-coverage
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/_layout.tsx
git commit -m "feat: invalidate check-in cache on app foreground (AppState)"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Schema change (Task 1) ✓ · `StreakStatus` type (Task 2) ✓ · `computeStreakStatus` algorithm (Task 3) ✓ · `useHabitStatus` hook (Task 4) ✓ · `useTodayStatus` deleted (Task 4) ✓ · `useCheckIn` simplified (Task 5) ✓ · AppState listener (Task 6) ✓
- [x] **Placeholder scan:** No TBDs, no "similar to task N", all code blocks complete
- [x] **Type consistency:** `StreakStatus` defined in Task 2, imported in Task 3 (`computeStreakStatus.ts`) and Task 4 (`useHabitStatus.ts`) ✓ · `checkInKeys.status(habitId)` used consistently in Tasks 4 and 5 ✓
