# togezer — Today screen & check-in loop design

**Date:** 2026-05-30
**Scope:** Flows 02 (daily check-in) + 03 (home/today). Builds the core daily loop on top of the existing data layer. No backend changes required.

---

## Context

The onboarding flow (sign-up → pick-habit → invite) is complete, but it delivers users to placeholder screens that render plain `<Text>today</Text>`. This spec covers the actual daily-use product: the **Today** home screen and the **check-in** modal.

The data layer already exists and is reused as-is:
- `useHabits` / `useHabitStatus` — my habit and streak (`computeStreakStatus` is implemented + tested)
- `useCheckIn` — inserts a `type: 'done'` check-in, invalidates status / friends-today / habit list
- RLS already permits friends to read each other's `profiles`, `habits`, and `check_ins` (migration 002) — so the friends feed needs **no schema or policy change**.

### Decisions locked during brainstorming
- **Iteration scope:** full Today screen *and* check-in modal, including the friends ("your gang") section.
- **Check-in contents:** tap-to-confirm + optional text note. **No photo capture** this iteration (camera + Storage upload is a focused follow-up; `photo_url` column already exists).
- **Check-in CTA placement:** *inside* the streak ink card (not a standalone button).
- **+1 success moment:** *inline tick-up* — the sheet morphs in place, streak number ticks up, then dismisses. No full-screen takeover (fits the "open, check, leave" ethos).
- **Refresh:** pull-to-refresh + existing AppState foreground invalidation. **Realtime deferred.**

---

## 1. Today screen

`app/(app)/(tabs)/index.tsx` — thin; composes feature components and hooks. No fetch logic in the screen file.

### Layout
- **Header:** `today` (display) + date label `fri · may 30` (mono, derived from local date).
- **My streak card** — `features/habits/components/StreakCard.tsx`:
  - Near-black ink background, paper text, red-ink (`#C2360F`) hard offset shadow.
  - Habit emoji + title, large streak number, `day streak` caption, grace indicator (`◆ N grace left this week`, derived from `graceTotalPW - graceUsedThisWeek`).
  - **Check-in CTA lives inside the card.** States:
    - *Not checked in today* → red `check in →` pill → `router.push('/check-in/{habitId}')`.
    - *Checked in today* → calm dashed/mint `checked in ✓`, non-pressable.
- **"your gang" section:**
  - Label `your gang` + counter `N of M in` (friends checked in today / total friends with an active habit). Counter uses red-ink color.
  - One **`FriendRow`** per friend: avatar (colored initial), display name, their habit (`🧘 meditate`), last-5-days `StreakDots`, and today's ✅ / ⬜.
  - Rows are **not interactive** this iteration (friend detail / reactions are later).

### States
- **Loading:** lightweight skeleton / spinner while `useHabits` / `useFriendsActivity` resolve.
- **No friends yet:** replace the gang list with a gentle "bring the gang" prompt linking to `/(onboarding)/invite` (or the invite entry point).
- **Friend with no active habit:** omitted from the list and from the counter denominator.
- **My card** always present (the routing guard guarantees the user has a habit before reaching `(app)`).

---

## 2. Check-in modal

`app/(app)/check-in/[habitId].tsx` — `presentation: 'modal'` (already registered in `(app)/_layout.tsx`). Thin; renders `features/check-in/components/CheckInSheet.tsx`.

`CheckInSheet` is a two-phase component (local `phase: 'form' | 'success'` state):

### Phase `form`
- Habit emoji + title, optional note `TextInput` (dashed box, placeholder "add a note… (optional)").
- `mark done ✓` confirm pill (red, hard shadow) → calls `useCheckIn().mutateAsync({ habitId, note })`.
- `not yet` ghost action → dismisses the modal.
- Confirm disabled / shows progress while the mutation is pending.

### Phase `success` (inline tick-up)
- Green check circle, `checked in for today` label.
- Streak tick-up: old number (struck through) → new number, where `new = preCheckInStatus.streak + 1`.
  - `computeStreakStatus` excludes today until a check-in exists (`startStr` walks from yesterday when `!hasCheckedInToday`), so `streak` read before check-in is the up-to-yesterday count; `+1` is the post-check-in value. Cache invalidation then refetches the authoritative number for the Today card.
- `nice →` pill dismisses the modal, returning to Today (card now in checked-in state).

### Mechanics & edge cases
- **Note:** trimmed; omitted when empty.
- **Idempotency:** `check_ins` has `UNIQUE (habit_id, user_id, checked_date)`. The card hides the CTA once checked in, but a unique-violation (Postgres `23505`) from a double-submit is treated as success (already done), not an error.
- **Mutation error (non-23505):** inline error message in the sheet; user can retry; modal stays open.
- `useCheckIn` is reused unchanged (it already invalidates `status` / `friendsToday` / habit `list`).

---

## 3. Data: `useFriendsActivity`

`features/friends/hooks/useFriendsActivity.ts`, query key `checkInKeys.friendsToday()`.

### Query
A single RLS-scoped query against `habits` with nested relations:

```ts
sb.from('habits')
  .select('id, user_id, title, emoji, created_at, grace_days_pw, ' +
          'profile:profiles!habits_user_id_fkey(id, display_name, username, avatar_url), ' +
          'check_ins(checked_date)')
  .eq('is_archived', false)
  .neq('user_id', userId)   // RLS already limits to own + friends'; this drops own
```

RLS (`habits_friends_read`, `check_ins_friends_read`, `profiles_friends_read`) ensures only friends' rows return.

### Transform (`select`)
Per habit row, assemble a `FriendActivity`:
```ts
type FriendActivity = {
  profile: Pick<Profile, 'id' | 'display_name' | 'username' | 'avatar_url'>
  habit: { id: string; title: string; emoji: string | null }
  status: StreakStatus            // via computeStreakStatus(check_ins, grace_days_pw, created_at, today)
  recentDates: string[]           // checked_date set, for StreakDots
}
```
Sorted by `profile.display_name`. Reuses the existing `computeStreakStatus` pure function — no duplicate streak logic.

---

## 4. Components

### Shared primitives (`components/`)
- **`Avatar.tsx`** — colored circle + uppercased initial, 2px ink border. Color is index-stable: hash `profile.id` → index into `Colors.avatarColors`. Props: `name`, `id`, `size?`. Falls back to `avatar_url` image if present (future-friendly; initial for now).
- **`StreakDots.tsx`** — renders the last `days` (default 5) calendar days as dots: filled ink if `checked_date` present, muted (`Colors.line`) otherwise. Props: `checkedDates: string[]`, `days?`. (Grace "miss" styling is a deliberate non-goal this iteration — on/off only.)

### Feature components
- **`features/habits/components/StreakCard.tsx`** — my ink card; props `habit` + `status`; renders streak, grace, and the inline check-in CTA (navigates to the modal).
- **`features/friends/components/FriendRow.tsx`** — one gang row; props `activity: FriendActivity`.
- **`features/check-in/components/CheckInSheet.tsx`** — the two-phase modal body (form → success).

---

## 5. Navigation

- Today CTA → `router.push('/check-in/{habitId}')` (modal).
- Modal `not yet` / `nice →` → `router.back()` / dismiss.
- Habit card body + friend rows: non-interactive this iteration.

No changes to `(app)/_layout.tsx` (modal already registered) or the routing guard.

---

## 6. Testing (TDD, matching existing patterns)

Existing tests mock `@clerk/expo` and the Supabase client and use `@testing-library/react-native`. New tests follow suit:

- **`useFriendsActivity`** — mocked Supabase returns habits+check_ins; assert it assembles per-friend `status` (integration with `computeStreakStatus`) and `recentDates`, drops own habit, sorts by name.
- **`StreakDots`** — pure render: given dates + reference today, correct count of on/off dots.
- **`Avatar`** — same `id` yields a stable color index across renders.
- **`CheckInSheet`** — confirm calls the mutation with `{ habitId, note }`; transitions to success phase showing the ticked-up streak; treats `23505` as success.
- **Today screen** — renders StreakCard + gang rows + counter with mocked hooks; empty-friends state renders the invite prompt.

---

## Out of scope (explicit)
Photo capture + Storage upload · habit detail screen · friend detail / reactions · nudges · streak-at-risk (Flow 05) · realtime subscriptions · grace "miss" dot styling. Each is a later, focused iteration.
