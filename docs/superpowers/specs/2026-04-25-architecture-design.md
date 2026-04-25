# togezer — architecture design

**Date:** 2026-04-25
**Scope:** MVP infrastructure — the foundation that all remaining screens and features build on.

---

## Context

togezer is a social habit-tracking app. Users pick a habit, check in once a day, and see their close friends' streaks. The MVP scope is: one habit per user (daily cadence only), friend connections via invite link (auto-accept), no cadence picker, no reaction/nudge features yet.

The goal of this document is to define the infrastructure so that implementing each remaining screen is straightforward and consistent.

---

## 1. Project structure

Feature-module layout. Screens in `app/` are thin — they import from `features/` and compose. No fetch logic lives in screen files.

```
app/
  _layout.tsx               — root Stack + providers (ClerkProvider, QueryClientProvider)
  index.tsx                 — routing guard (redirects based on auth + onboarding state)

  (auth)/
    _layout.tsx
    index.tsx               — welcome screen ✓
    sign-up.tsx             — SSO (Google, Facebook) ✓
    sign-up-email.tsx       — email OTP ✓
    sign-in.tsx             — stub, needs implementation

  (onboarding)/
    _layout.tsx
    pick-habit.tsx          — step 1: what are you trying to do?
    invite.tsx              — step 2: bring the gang (no cadence picker in MVP)

  (app)/
    _layout.tsx             — Stack: contains tabs + pushed screens + modal
    (tabs)/
      _layout.tsx           — Tabs: Today · Friends · You
      index.tsx             — today / home
      friends.tsx           — friends list
      you.tsx               — profile + habits list
    habits/
      [id].tsx              — habit detail — pushed, covers tab bar
    check-in/
      [habitId].tsx         — modal sheet (presentation: 'modal')

  j/
    [code].tsx              — invite link handler (deep link entry point)

features/
  auth/                     — useCurrentUser, post-sign-up hook
  habits/
    hooks/                  — useHabits, useHabit, useHasHabit, useCreateHabit, useArchiveHabit
    components/             — HabitCard, HabitRow, StreakDots
    types.ts
  check-in/
    hooks/                  — useCheckIn, useTodayStatus
    components/             — CheckInSheet, ConfirmationScreen
    types.ts
  friends/
    hooks/                  — useFriends, useInviteCode, useAcceptInvite
    components/             — FriendCard, FriendStreak
    types.ts
  notifications/
    hooks/                  — useRegisterPushToken
    types.ts

lib/
  supabase.ts               — Supabase client wired to Clerk JWT (context provider)
  database.types.ts         — generated: npx supabase gen types typescript
  queryClient.ts            — React Query client + default options

components/                 — shared primitives only (Button ✓, Logo ✓, Avatar, StreakDots)
constants/
  theme.ts                  — ✓ exists
```

---

## 2. Data model

### Tables

#### `profiles`
| column | type | notes |
|---|---|---|
| id | text PK | = Clerk user ID (`user_2abc…`) |
| username | text unique | |
| display_name | text | |
| avatar_url | text? | |
| push_token | text? | Expo device push token |
| timezone | text | e.g. `"Europe/London"` — required for streak-risk notifications |
| created_at | timestamptz | |

#### `habits`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | text FK → profiles | |
| title | text | |
| emoji | text? | |
| cadence | text | `'daily'` (only value in MVP; column exists for future expansion) |
| reminder_time | time? | e.g. `07:00` |
| grace_days_pw | int | default `1` |
| is_archived | bool | default `false` |
| created_at | timestamptz | |

#### `check_ins`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| habit_id | uuid FK → habits | |
| user_id | text FK → profiles | |
| checked_date | date | **DATE not TIMESTAMP** — see note below |
| type | text | `'done'` or `'grace'` |
| photo_url | text? | Supabase Storage URL |
| note | text? | |
| created_at | timestamptz | full audit timestamp |
| | | UNIQUE (habit_id, user_id, checked_date) |

> **Why `checked_date` is a `DATE`:** streaks are day-based. A check-in at 11:59pm in one timezone lands on a different calendar date when compared server-side in UTC, breaking streak counts. The client sends the user's local date string; the server stores and compares it as-is.

#### `friendships`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_a_id | text FK → profiles | |
| user_b_id | text FK → profiles | |
| created_at | timestamptz | |
| | | CHECK (user_a_id < user_b_id) — canonical ordering prevents duplicates |
| | | UNIQUE (user_a_id, user_b_id) |

No `status` column — the MVP invite link auto-accepts. A `status` column can be added later for a friend-request flow without any other schema changes.

#### `invite_codes`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| code | text unique | short code, e.g. `"9f2k"` |
| created_by | text FK → profiles | |
| accepted_by | text? FK → profiles | null until used |
| expires_at | timestamptz | |
| created_at | timestamptz | |

#### `nudges` *(schema defined now, feature deferred)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| from_user_id | text FK → profiles | |
| to_user_id | text FK → profiles | |
| habit_id | uuid FK → habits | |
| created_at | timestamptz | |
| | | UNIQUE (from_user_id, to_user_id, habit_id, date(created_at)) — one nudge per day |

#### `reactions` *(schema defined now, feature deferred)*
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| check_in_id | uuid FK → check_ins | |
| user_id | text FK → profiles | |
| emoji | text | |
| created_at | timestamptz | |
| | | UNIQUE (check_in_id, user_id, emoji) |

---

## 3. Clerk ↔ Supabase integration

### Auth approach
- Auth: **Clerk** (kept — better OAuth provider breadth, mature Expo SDK, auth screens already built)
- Database: **Supabase** with a JWT bridge

### JWT bridge setup
1. In Clerk dashboard: create a JWT template named `"supabase"`. Set audience to your Supabase project URL. The `sub` claim is the Clerk user ID.
2. In Supabase dashboard: set JWT secret to match Clerk's signing key (or use the JWKS URL).
3. RLS policies use `auth.jwt() ->> 'sub'` to identify the calling user.

### Supabase client (`lib/supabase.ts`)
The client lives in a React context provider — one instance per session, not recreated per component. Every feature hook receives it via `useSupabase()`.

```ts
// Simplified — memo-ise in a context provider in practice
import { createClient } from '@supabase/supabase-js'

export function makeSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken()
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        })
      },
    },
  })
}
```

### RLS policy pattern

```sql
-- profiles: own row only
CREATE POLICY "own profile" ON profiles
  USING (id = auth.jwt() ->> 'sub');

-- habits: own habits only
CREATE POLICY "own habits" ON habits
  USING (user_id = auth.jwt() ->> 'sub');

-- check_ins: owner OR mutual friend can read
CREATE POLICY "friends can read check_ins" ON check_ins
  FOR SELECT USING (
    user_id = auth.jwt() ->> 'sub'
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = auth.jwt() ->> 'sub' AND user_b_id = check_ins.user_id)
         OR (user_b_id = auth.jwt() ->> 'sub' AND user_a_id = check_ins.user_id)
    )
  );
```

### React Query (`lib/queryClient.ts`)

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min
      gcTime:    1000 * 60 * 10,  // 10 min
      retry: 1,
    },
  },
})
```

### Query key factory pattern (one per feature)

```ts
export const habitKeys = {
  all:    ()           => ['habits']                as const,
  list:   ()           => ['habits', 'list']        as const,
  detail: (id: string) => ['habits', 'detail', id]  as const,
}
```

### Supabase Realtime → cache invalidation
Only the home screen (friends' today feed) uses a live subscription. All other screens rely on normal stale-time refetching.

```ts
// features/friends/hooks/useFriendsActivity.ts
useEffect(() => {
  const channel = sb
    .channel('check_ins')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' }, () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.friendsToday() })
    })
    .subscribe()
  return () => sb.removeChannel(channel)
}, [sb])
```

---

## 4. Navigation structure

### Routing guard (`app/index.tsx`)

```ts
export default function Guard() {
  const { isSignedIn, isLoaded } = useAuth()
  const { hasHabit } = useHasHabit() // React Query

  if (!isLoaded) return <Splash />
  if (!isSignedIn) return <Redirect href="/(auth)" />
  if (!hasHabit)   return <Redirect href="/(onboarding)/pick-habit" />
  return <Redirect href="/(app)" />
}
```

### Key navigation decisions

| Decision | Rationale |
|---|---|
| `(app)/_layout.tsx` is a **Stack** (not Tabs directly) | Lets `habits/[id]` push over the tab bar, and `check-in/[habitId]` present as a modal |
| Check-in is a **modal sheet** | Launched from a habit card on Today or You tab. Dismissing always returns to the previous tab. |
| Onboarding is its own route group | Guard routes there when signed in but no habit yet. Re-entry after completion skips it transparently. |
| Tab bar: **Today · Friends · You** | No check-in tab — the action lives on habit cards. Keeps the bar minimal. |
| Cadence screen **skipped in MVP** | Onboarding is pick-habit → invite (two steps, not three). The `cadence` column defaults to `'daily'`. |

---

## 5. Invite links & deep linking

### Link format
`https://togezer.vercel.app/j/{code}`

Universal links via a free Vercel deployment. No domain purchase required.

### Vercel project (tiny — not the main app)
- `public/.well-known/apple-app-site-association` — iOS universal link config
- `public/.well-known/assetlinks.json` — Android App Links config
- `pages/j/[code].tsx` (or equivalent) — tries `togezer://j/{code}`, falls back to App Store link

### `app.json` config

```json
{
  "expo": {
    "scheme": "togezer",
    "ios": {
      "associatedDomains": ["applinks:togezer.vercel.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "https", "host": "togezer.vercel.app", "pathPrefix": "/j/" }]
      }]
    }
  }
}
```

### Two cases the route handler must cover

**Case A — User B already has an account:**
`app/j/[code].tsx` reads the code, calls `acceptInvite()`, redirects to `/(app)`.

**Case B — User B is new:**
`app/j/[code].tsx` stores the code in `AsyncStorage` under `pendingInvite`, redirects to `/(auth)/sign-up`. After sign-up, `handlePostSignUp()` checks `AsyncStorage`, calls `acceptInvite()`, clears the key, then continues to onboarding.

### `acceptInvite()` — Supabase Edge Function

Runs with the service role key to atomically:
1. Validate the code exists, hasn't expired, and hasn't been used.
2. Insert a `friendships` row (canonical ordering: `user_a_id < user_b_id`).
3. Set `invite_codes.accepted_by` to the accepting user's ID.

Must be an Edge Function (not a client-side operation) because the two writes need to be atomic.

### Development note
Universal links don't work in Expo Go or the iOS simulator. Use `exp+togezer://j/{code}` (Expo's dev scheme) locally — the same `app/j/[code].tsx` route handles it.

---

## 6. Scheduled notifications (streak-risk nudges)

### Flow
```
GCP Cloud Scheduler (cron, runs hourly)
  → Cloud Function
    → query Supabase (service role key)
      → find users whose streak is at risk this evening (per timezone)
    → call Expo Push API with stored push_tokens
      → delivers to APNs / FCM
```

- Push tokens stored in `profiles.push_token`, registered on app open via `useRegisterPushToken()`.
- The Cloud Function uses the Supabase service role key — bypasses RLS, full read access.
- GCP handles retry, observability, and cron syntax. Supabase Edge Functions are not used here (Cloud Scheduler + Cloud Run is the right tool for a fan-out notification job).

---

## What this enables

With this foundation in place, each remaining screen maps cleanly to a feature module:

| Screen | Feature module | New tables needed |
|---|---|---|
| Sign-in | `features/auth` | none |
| Pick habit (onboarding) | `features/habits` | `habits` |
| Invite (onboarding) | `features/friends` | `invite_codes`, `friendships` |
| Today / home | `features/habits`, `features/friends` | `check_ins` |
| Check-in modal | `features/check-in` | `check_ins` |
| Habit detail | `features/habits` | none |
| Friends list | `features/friends` | none |
| Streak-at-risk | `features/check-in`, `features/notifications` | none |
| Nudge (future) | `features/friends` | `nudges` |
| Reactions (future) | `features/check-in` | `reactions` |
