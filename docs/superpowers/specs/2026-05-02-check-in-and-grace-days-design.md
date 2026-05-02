# Check-in & Grace Days — Infrastructure Design

**Date:** 2026-05-02

## Summary

This document covers the backend and client-side infrastructure for daily habit check-ins and grace days in togezer. It does not cover UI/screen design.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Grace day trigger | Passive / automatic | Users never explicitly declare a grace day; gaps are inferred |
| Grace storage | Not stored — computed on read | No background jobs, no grace records in DB |
| Streak computation | Client-side TypeScript | Simple to write and test; data is small (≤365 rows) |
| Grace counts toward streak | No | Grace protects the streak from breaking but does not increment the counter |
| Week boundary | Sun–Sat calendar week | Hardcoded for now (Israel convention) |
| Streak before today's check-in | Shows yesterday's confirmed count | Today is "open" — not a missed day until it closes |
| Grace budget surfaced in UI | Yes | Returns `graceUsedThisWeek` + `graceTotalPW` so UI can warn when budget is spent |
| App foreground invalidation | `AppState` listener | Invalidates streak cache when app resumes to catch midnight rollovers |

---

## 1. Schema Changes

### `check_ins.type` constraint

Drop `'grace'` from the allowed values. Grace is inferred, never stored.

```sql
-- before
CHECK (type IN ('done', 'grace'))

-- after
CHECK (type IN ('done'))
```

The `type` column is retained for potential future check-in types (e.g. `'rest-day'`), but will always be `'done'` for now.

### `habits.grace_days_pw`

No change. This column remains the per-habit grace budget config (default 1).

---

## 2. Pure Compute Function

**Location:** `features/check-in/lib/computeStreakStatus.ts`

No React, no Supabase — pure TypeScript, fully unit-testable.

### Return type

```ts
type StreakStatus = {
  streak: number            // done check-ins in current unbroken run
  graceUsedThisWeek: number // missed days absorbed by grace in the current Sun–Sat week
  graceTotalPW: number      // passed through from habit.grace_days_pw
  hasCheckedInToday: boolean
}
```

### Signature

```ts
function computeStreakStatus(
  checkIns: { checked_date: string }[], // all done check-ins for the habit
  graceDaysPW: number,
  habitCreatedAt: Date,
  today: Date
): StreakStatus
```

### Algorithm

1. Build a `Set<string>` of all `checked_date` values for O(1) lookup.
2. `hasCheckedInToday` = today's date string is in the set.
3. Walk backward day by day, starting from:
   - **today** — if the user has already checked in today
   - **yesterday** — if not (today is still open, not a missed day)
4. Stop walking when the cursor goes before `habitCreatedAt` — days before the habit existed are not missed days.
5. For each cursor day:
   - **In the set** → commit any pending grace days for this run, then `streak++`
   - **Not in the set** (missed past day) → add to a pending buffer if the weekly budget allows (committed + pending < graceDaysPW), else break
6. Pending grace days are only committed when a check-in is found on both sides of the gap. Trailing missed days at the end of the walk are never committed.
7. `graceUsedThisWeek` = committed (not pending) grace days in the Sun–Sat week containing `today`.

This **pending-grace** approach means `graceUsedThisWeek` reflects grace that actually saved a streak connection, not trailing misses. If a streak breaks, `graceUsedThisWeek` may be 0 — the grace day is still available for the next run.

---

## 3. `useHabitStatus` Hook

**Location:** `features/check-in/hooks/useHabitStatus.ts`

Replaces and absorbs `useTodayStatus` (which is deleted).

### Signature

```ts
function useHabitStatus(habit: Habit): UseQueryResult<StreakStatus>
```

Takes the full `Habit` object — needs `id`, `grace_days_pw`, `created_at`.

### Fetch behaviour

- Queries `check_ins` for `habit_id = habit.id` and `user_id = currentUserId`
- Filters `checked_date >= habit.created_at` (naturally bounded by habit age — no arbitrary cap)
- Ordered by `checked_date DESC`
- Results passed directly to `computeStreakStatus`

### Cache key

`checkInKeys.status(habit.id)` — replaces the old `checkInKeys.todayStatus()` key.

Invalidated in `useCheckIn.onSuccess` (already wired; key rename required).

### Staleness

`staleTime` is not set (defaults to 0 — always considered stale on window focus). A separate `AppState` listener invalidates `checkInKeys.status()` whenever the app returns to the foreground, catching midnight rollovers without polling.

---

## 4. `useCheckIn` Simplification

Remove `type` from `CheckInInput`. All check-ins are `'done'`; the insert hardcodes `type: 'done'`.

```ts
// before
type CheckInInput = {
  habitId: string
  type: 'done' | 'grace'
  photoUrl?: string
  note?: string
}

// after
type CheckInInput = {
  habitId: string
  photoUrl?: string
  note?: string
}
```

---

## 5. Files Touched

| File | Change |
|---|---|
| `supabase/migrations/003_checkin_type_done_only.sql` | Drop `'grace'` from `type` constraint |
| `features/check-in/lib/computeStreakStatus.ts` | New — pure compute function |
| `features/check-in/hooks/useHabitStatus.ts` | New — replaces `useTodayStatus` |
| `features/check-in/hooks/useTodayStatus.ts` | Deleted |
| `features/check-in/hooks/useCheckIn.ts` | Remove `type` from input, hardcode `'done'` |
| `features/check-in/hooks/keys.ts` | Replace `todayStatus` key with `status(habitId)` |
| `app/(app)/_layout.tsx` | Add `AppState` listener to invalidate streak cache on foreground |
| All callsites of `useTodayStatus` | Migrate to `useHabitStatus` |

---

## Out of Scope

- Non-daily cadences (the algorithm assumes daily)
- Timezone-aware week boundaries (Sun–Sat is hardcoded; no per-user timezone week calculation)
- Paired streaks (separate feature)
- Friends' streak computation (same algorithm, different `userId`)
