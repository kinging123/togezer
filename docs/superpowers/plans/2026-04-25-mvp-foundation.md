# MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the complete infrastructure layer — database schema, Clerk↔Supabase auth bridge, React Query data layer, feature hooks, and navigation structure — so every subsequent screen task is a thin composition of existing hooks with no plumbing work left to do.

**Architecture:** Supabase (Postgres + Realtime + Storage + Edge Functions) as backend, Clerk for auth with a JWT bridge to Supabase RLS, React Query for all server state. Feature-module layout: `features/<name>/hooks/` and `features/<name>/types.ts` per domain. Screens in `app/` are thin wrappers. Universal invite deep links served via a free Vercel deployment.

**Tech Stack:** Expo SDK 54, Expo Router v6, Clerk `@clerk/expo`, `@supabase/supabase-js`, `@tanstack/react-query`, Supabase CLI, Deno (Edge Functions), Vercel (web redirect layer)

---

## File Map

### New files
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/functions/accept-invite/index.ts

lib/supabase.ts
lib/SupabaseProvider.tsx
lib/queryClient.ts
lib/database.types.ts               ← generated, do not hand-edit

features/auth/hooks/useCurrentUser.ts
features/auth/hooks/usePostSignUp.ts

features/habits/hooks/keys.ts
features/habits/hooks/useHabits.ts
features/habits/hooks/useHabit.ts
features/habits/hooks/useHasHabit.ts
features/habits/hooks/useCreateHabit.ts
features/habits/hooks/useArchiveHabit.ts
features/habits/types.ts

features/check-in/hooks/keys.ts
features/check-in/hooks/useCheckIn.ts
features/check-in/hooks/useTodayStatus.ts
features/check-in/types.ts

features/friends/hooks/keys.ts
features/friends/hooks/useFriends.ts
features/friends/hooks/useInviteCode.ts
features/friends/hooks/useAcceptInvite.ts
features/friends/types.ts

features/notifications/hooks/useRegisterPushToken.ts
features/notifications/types.ts

app/index.tsx                        ← replaces current stub
app/(onboarding)/_layout.tsx
app/(onboarding)/pick-habit.tsx      ← stub screen
app/(onboarding)/invite.tsx          ← stub screen
app/(app)/(tabs)/_layout.tsx
app/(app)/(tabs)/index.tsx           ← stub screen (today)
app/(app)/(tabs)/friends.tsx         ← stub screen
app/(app)/(tabs)/you.tsx             ← stub screen
app/(app)/habits/[id].tsx            ← stub screen
app/(app)/check-in/[habitId].tsx     ← stub screen (modal)
app/j/[code].tsx                     ← invite deep link handler

web/vercel.json
web/package.json
web/pages/j/[code].tsx
web/public/.well-known/apple-app-site-association
web/public/.well-known/assetlinks.json

__tests__/test-utils.tsx
__tests__/features/habits/useHabits.test.tsx
__tests__/features/habits/useHasHabit.test.tsx
__tests__/features/friends/useInviteCode.test.tsx
__tests__/app/j/[code].test.tsx
```

### Modified files
```
package.json                         ← add deps + jest config
app/_layout.tsx                      ← add SupabaseProvider + QueryClientProvider
app/(auth)/sign-up.tsx               ← call handlePostSignUp after OAuth success
app/(auth)/sign-up-email.tsx         ← call handlePostSignUp after email OTP success
app.json                             ← add scheme + associatedDomains
.env                                 ← add SUPABASE vars
```

---

### Task 1: Install dependencies + set up Jest

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npx expo install @supabase/supabase-js @tanstack/react-query @react-native-async-storage/async-storage
```

Expected: packages added to `node_modules` and `package.json` dependencies.

- [ ] **Step 2: Install dev/test dependencies**

```bash
npm install --save-dev jest-expo @testing-library/react-native @testing-library/jest-native
```

Expected: packages added to `devDependencies`.

- [ ] **Step 3: Add jest config to `package.json`**

Add after the `"private": true` line:

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@clerk/.*|@supabase/.*)"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/$1"
  }
}
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` block add:

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: Verify Jest runs**

```bash
npx jest --passWithNoTests
```

Expected output ends with: `Test Suites: 0 passed, 0 total`

- [ ] **Step 6: Create test utilities**

Create `__tests__/test-utils.tsx`:

```tsx
import React from 'react'
import { renderHook } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderHookWithQuery<T>(hook: () => T) {
  const queryClient = createTestQueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { ...renderHook(hook, { wrapper }), queryClient }
}
```

- [ ] **Step 7: Commit**

```bash
git add package.json __tests__/test-utils.tsx
git commit -m "chore: add Supabase, React Query, and Jest dependencies"
```

---

### Task 2: Supabase CLI setup + schema migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Install Supabase CLI (if not installed)**

```bash
brew install supabase/tap/supabase
```

Verify: `supabase --version` — expected: `2.x.x`

- [ ] **Step 2: Create a Supabase project**

Go to [supabase.com](https://supabase.com), create a new project, note the **Project URL** and **anon key** from Settings → API.

- [ ] **Step 3: Initialise Supabase in the repo**

```bash
supabase init
```

Expected: creates `supabase/` directory with `config.toml`.

- [ ] **Step 4: Link to your project**

```bash
supabase link --project-ref <your-project-ref>
```

`<your-project-ref>` is the string in your Supabase project URL: `https://<ref>.supabase.co`.

- [ ] **Step 5: Create the migration file**

```bash
supabase migration new initial_schema
```

Expected: creates `supabase/migrations/<timestamp>_initial_schema.sql`. Rename it or copy the path — we'll write the SQL next.

- [ ] **Step 6: Write the schema**

Paste the following into the migration file created in the previous step:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles — Clerk user ID is the primary key
CREATE TABLE profiles (
  id           text PRIMARY KEY,
  username     text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url   text,
  push_token   text,
  timezone     text NOT NULL DEFAULT 'UTC',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- habits
CREATE TABLE habits (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text NOT NULL,
  emoji         text,
  cadence       text NOT NULL DEFAULT 'daily',
  reminder_time time,
  grace_days_pw int  NOT NULL DEFAULT 1,
  is_archived   bool NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- check_ins — checked_date is DATE (not TIMESTAMP) for timezone-safe streak counting
CREATE TABLE check_ins (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id     uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id      text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checked_date date NOT NULL,
  type         text NOT NULL CHECK (type IN ('done', 'grace')),
  photo_url    text,
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, user_id, checked_date)
);

-- friendships — canonical ordering enforces no duplicate pairs
CREATE TABLE friendships (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id  text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id  text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);

-- invite_codes
CREATE TABLE invite_codes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        text UNIQUE NOT NULL,
  created_by  text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_by text REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- nudges — schema defined now, feature deferred
CREATE TABLE nudges (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id     uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id, habit_id, (created_at::date))
);

-- reactions — schema defined now, feature deferred
CREATE TABLE reactions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_id uuid NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  user_id     text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (check_in_id, user_id, emoji)
);
```

- [ ] **Step 7: Push the migration**

```bash
supabase db push
```

Expected: `Applying migration ... done.` — no errors.

- [ ] **Step 8: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema migration"
```

---

### Task 3: RLS policies

**Files:**
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Create the migration file**

```bash
supabase migration new rls_policies
```

- [ ] **Step 2: Write the RLS policies**

Paste into the new migration file:

```sql
-- Enable RLS on every table
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions   ENABLE ROW LEVEL SECURITY;

-- Helper: extract Clerk user ID from JWT sub claim
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT auth.jwt() ->> 'sub' $$;

-- profiles: own row + friends' rows (needed for home screen avatar/name)
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.user_id());

CREATE POLICY "profiles_friends_read" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = auth.user_id() AND user_b_id = profiles.id)
         OR (user_b_id = auth.user_id() AND user_a_id = profiles.id)
    )
  );

-- habits: own + friends' (read-only for friends)
CREATE POLICY "habits_own" ON habits
  FOR ALL USING (user_id = auth.user_id());

CREATE POLICY "habits_friends_read" ON habits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = auth.user_id() AND user_b_id = habits.user_id)
         OR (user_b_id = auth.user_id() AND user_a_id = habits.user_id)
    )
  );

-- check_ins: own + friends' (read-only for friends)
CREATE POLICY "check_ins_own" ON check_ins
  FOR ALL USING (user_id = auth.user_id());

CREATE POLICY "check_ins_friends_read" ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = auth.user_id() AND user_b_id = check_ins.user_id)
         OR (user_b_id = auth.user_id() AND user_a_id = check_ins.user_id)
    )
  );

-- friendships: see your own connections
CREATE POLICY "friendships_own" ON friendships
  FOR SELECT USING (user_a_id = auth.user_id() OR user_b_id = auth.user_id());

-- invite_codes: create + read your own
CREATE POLICY "invite_codes_own_read" ON invite_codes
  FOR SELECT USING (created_by = auth.user_id());

CREATE POLICY "invite_codes_own_insert" ON invite_codes
  FOR INSERT WITH CHECK (created_by = auth.user_id());

-- nudges: send + receive
CREATE POLICY "nudges_sent" ON nudges
  FOR ALL USING (from_user_id = auth.user_id());

CREATE POLICY "nudges_received_read" ON nudges
  FOR SELECT USING (to_user_id = auth.user_id());

-- reactions: own + friends' check-in reactions
CREATE POLICY "reactions_own" ON reactions
  FOR ALL USING (user_id = auth.user_id());

CREATE POLICY "reactions_friends_read" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM check_ins
      WHERE check_ins.id = reactions.check_in_id
        AND EXISTS (
          SELECT 1 FROM friendships
          WHERE (user_a_id = auth.user_id() AND user_b_id = check_ins.user_id)
             OR (user_b_id = auth.user_id() AND user_a_id = check_ins.user_id)
        )
    )
  );
```

- [ ] **Step 3: Push the migration**

```bash
supabase db push
```

Expected: `Applying migration ... done.`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add RLS policies for all tables"
```

---

### Task 4: Generate TypeScript types + env setup

**Files:**
- Create: `lib/database.types.ts`
- Modify: `.env`

- [ ] **Step 1: Generate types from the live schema**

```bash
npx supabase gen types typescript --project-id <your-project-ref> > lib/database.types.ts
```

Expected: `lib/database.types.ts` is created with `Database` interface containing all 7 tables.

- [ ] **Step 2: Verify the file looks right**

```bash
grep "profiles\|habits\|check_ins\|friendships\|invite_codes" lib/database.types.ts
```

Expected: all 5 table names appear.

- [ ] **Step 3: Add Supabase env vars to `.env`**

```bash
# Add to existing .env file
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

The URL and anon key are in Supabase Settings → API. The service role key is in the same page — keep it out of source control (`.env` is already gitignored).

- [ ] **Step 4: Commit (types only — not .env)**

```bash
git add lib/database.types.ts
git commit -m "feat: add generated Supabase TypeScript types"
```

---

### Task 5: Clerk JWT template + Supabase config

**Files:** (no code — dashboard config only)

- [ ] **Step 1: Create JWT template in Clerk dashboard**

1. Go to [clerk.com](https://clerk.com) → your app → **JWT Templates**
2. Click **New template** → choose **Supabase**
3. Clerk pre-fills the template. Verify it includes `"sub": "{{user.id}}"` and the audience is your Supabase URL.
4. Name it exactly `supabase` (lowercase — this is what `getToken({ template: 'supabase' })` expects).
5. Save. Copy the **Signing key** shown on the template page.

- [ ] **Step 2: Configure Supabase to trust Clerk JWTs**

1. In Supabase dashboard → **Settings** → **API**
2. Scroll to **JWT Settings**
3. Paste the Clerk signing key into the **JWT Secret** field
4. Save

- [ ] **Step 3: Smoke-test the bridge manually**

In Clerk dashboard → JWT Templates → `supabase` → click **Test** → copy the token. In Supabase SQL Editor run:

```sql
-- Paste the token as the auth header in a test query
SELECT auth.jwt() ->> 'sub';
```

If the bridge is configured correctly this returns your Clerk user ID. (You can also test via the Supabase API tab with Bearer auth.)

---

### Task 6: Supabase client + SupabaseProvider

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/SupabaseProvider.tsx`
- Test: `__tests__/lib/SupabaseProvider.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/SupabaseProvider.test.tsx`:

```tsx
import React from 'react'
import { renderHook } from '@testing-library/react-native'
import { useSupabase, SupabaseProvider } from '@/lib/SupabaseProvider'

jest.mock('@clerk/expo', () => ({
  useSession: () => ({ session: { getToken: jest.fn().mockResolvedValue('test-token') } }),
}))

describe('SupabaseProvider', () => {
  it('provides a Supabase client via useSupabase', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SupabaseProvider>{children}</SupabaseProvider>
    )
    const { result } = renderHook(() => useSupabase(), { wrapper })
    expect(result.current).toBeDefined()
    expect(typeof result.current.from).toBe('function')
  })

  it('throws when useSupabase is called outside the provider', () => {
    expect(() => renderHook(() => useSupabase())).toThrow(
      'useSupabase must be used within SupabaseProvider'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/SupabaseProvider.test.tsx
```

Expected: FAIL — `Cannot find module '@/lib/SupabaseProvider'`

- [ ] **Step 3: Create `lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export function makeSupabaseClient(getToken: () => Promise<string | null>) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken()
        return fetch(url, {
          ...options,
          headers: {
            ...(options.headers as Record<string, string>),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      },
    },
  })
}

export type SupabaseClient = ReturnType<typeof makeSupabaseClient>
```

- [ ] **Step 4: Create `lib/SupabaseProvider.tsx`**

```tsx
import { createContext, useContext, useMemo } from 'react'
import { useSession } from '@clerk/expo'
import { makeSupabaseClient, type SupabaseClient } from './supabase'

const SupabaseContext = createContext<SupabaseClient | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession()

  const client = useMemo(
    () =>
      makeSupabaseClient(
        () => session?.getToken({ template: 'supabase' }) ?? Promise.resolve(null)
      ),
    [session]
  )

  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext)
  if (!client) throw new Error('useSupabase must be used within SupabaseProvider')
  return client
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest __tests__/lib/SupabaseProvider.test.tsx
```

Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/supabase.ts lib/SupabaseProvider.tsx __tests__/lib/SupabaseProvider.test.tsx
git commit -m "feat: add Supabase client and SupabaseProvider"
```

---

### Task 7: React Query setup + update root layout

**Files:**
- Create: `lib/queryClient.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create `lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query'

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

- [ ] **Step 2: Update `app/_layout.tsx` to add providers**

```tsx
import { ClerkProvider } from '@clerk/expo'
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono'
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { tokenCache } from '@/lib/clerk-token-cache'
import { queryClient } from '@/lib/queryClient'
import { SupabaseProvider } from '@/lib/SupabaseProvider'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <SupabaseProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </SupabaseProvider>
    </ClerkProvider>
  )
}
```

- [ ] **Step 3: Verify the app starts without error**

```bash
npx expo start --ios
```

Expected: app launches to the existing welcome screen with no console errors.

- [ ] **Step 4: Commit**

```bash
git add lib/queryClient.ts app/_layout.tsx
git commit -m "feat: add React Query and SupabaseProvider to root layout"
```

---

### Task 8: Feature type definitions

**Files:**
- Create: `features/habits/types.ts`
- Create: `features/check-in/types.ts`
- Create: `features/friends/types.ts`
- Create: `features/notifications/types.ts`

- [ ] **Step 1: Create `features/habits/types.ts`**

```ts
import type { Database } from '@/lib/database.types'

export type Habit       = Database['public']['Tables']['habits']['Row']
export type HabitInsert = Database['public']['Tables']['habits']['Insert']
export type HabitUpdate = Database['public']['Tables']['habits']['Update']
```

- [ ] **Step 2: Create `features/check-in/types.ts`**

```ts
import type { Database } from '@/lib/database.types'

export type CheckIn       = Database['public']['Tables']['check_ins']['Row']
export type CheckInInsert = Database['public']['Tables']['check_ins']['Insert']
```

- [ ] **Step 3: Create `features/friends/types.ts`**

```ts
import type { Database } from '@/lib/database.types'

export type Profile    = Database['public']['Tables']['profiles']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type InviteCode = Database['public']['Tables']['invite_codes']['Row']

export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
```

- [ ] **Step 4: Create `features/notifications/types.ts`**

```ts
export type PushTokenPayload = {
  token: string
  platform: 'ios' | 'android'
}
```

- [ ] **Step 5: Commit**

```bash
git add features/
git commit -m "feat: add feature module type definitions"
```

---

### Task 9: Habit query hooks

**Files:**
- Create: `features/habits/hooks/keys.ts`
- Create: `features/habits/hooks/useHabits.ts`
- Create: `features/habits/hooks/useHabit.ts`
- Create: `features/habits/hooks/useHasHabit.ts`
- Create: `features/habits/hooks/useCreateHabit.ts`
- Create: `features/habits/hooks/useArchiveHabit.ts`
- Test: `__tests__/features/habits/useHabits.test.tsx`
- Test: `__tests__/features/habits/useHasHabit.test.tsx`

- [ ] **Step 1: Create `features/habits/hooks/keys.ts`**

```ts
export const habitKeys = {
  all:      ()           => ['habits']                  as const,
  list:     ()           => ['habits', 'list']          as const,
  hasHabit: ()           => ['habits', 'has-habit']     as const,
  detail:   (id: string) => ['habits', 'detail', id]    as const,
}
```

- [ ] **Step 2: Write failing tests**

Create `__tests__/features/habits/useHabits.test.tsx`:

```tsx
import { renderHookWithQuery } from '../../test-utils'
import { useHabits } from '@/features/habits/hooks/useHabits'
import { waitFor } from '@testing-library/react-native'

const mockHabits = [
  { id: 'h1', title: 'journal', is_archived: false, user_id: 'u1', cadence: 'daily',
    emoji: null, reminder_time: null, grace_days_pw: 1, created_at: '2026-01-01' },
]

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  order:  jest.fn().mockResolvedValue({ data: mockHabits, error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useHabits', () => {
  it('fetches non-archived habits ordered by created_at', async () => {
    const { result } = renderHookWithQuery(() => useHabits())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockHabits)
    expect(mockFrom).toHaveBeenCalledWith('habits')
  })
})
```

Create `__tests__/features/habits/useHasHabit.test.tsx`:

```tsx
import { renderHookWithQuery } from '../../test-utils'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'
import { waitFor } from '@testing-library/react-native'

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: true }),
}))

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockResolvedValue({ count: 2, error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useHasHabit', () => {
  it('returns true when the user has at least one active habit', async () => {
    const { result } = renderHookWithQuery(() => useHasHabit())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasHabit).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest __tests__/features/habits/
```

Expected: FAIL — `Cannot find module '@/features/habits/hooks/useHabits'`

- [ ] **Step 4: Create `features/habits/hooks/useHabits.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHabits() {
  const sb = useSupabase()
  return useQuery({
    queryKey: habitKeys.list(),
    queryFn: async () => {
      const { data, error } = await sb
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}
```

- [ ] **Step 5: Create `features/habits/hooks/useHasHabit.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHasHabit() {
  const sb = useSupabase()
  const { isSignedIn } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: habitKeys.hasHabit(),
    queryFn: async () => {
      const { count, error } = await sb
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false)
      if (error) throw error
      return (count ?? 0) > 0
    },
    enabled: !!isSignedIn,
  })

  return {
    hasHabit: data ?? false,
    isLoading: isSignedIn ? isLoading : false,
  }
}
```

- [ ] **Step 6: Create `features/habits/hooks/useHabit.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { habitKeys } from './keys'

export function useHabit(id: string) {
  const sb = useSupabase()
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await sb
        .from('habits')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}
```

- [ ] **Step 7: Create `features/habits/hooks/useCreateHabit.ts`**

```ts
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import type { HabitInsert } from '../types'
import { habitKeys } from './keys'

export function useCreateHabit() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<HabitInsert, 'user_id'>) => {
      const { data, error } = await sb
        .from('habits')
        .insert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all() })
    },
  })
}
```

- [ ] **Step 8: Create `features/habits/hooks/useArchiveHabit.ts`**

```ts
import { useMutation } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { habitKeys } from './keys'

export function useArchiveHabit() {
  const sb = useSupabase()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb
        .from('habits')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all() })
    },
  })
}
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
npx jest __tests__/features/habits/
```

Expected: PASS (2 test files)

- [ ] **Step 10: Commit**

```bash
git add features/habits/ __tests__/features/habits/
git commit -m "feat: add habit query hooks (useHabits, useHasHabit, useHabit, useCreateHabit, useArchiveHabit)"
```

---

### Task 10: Auth + post-sign-up hook

**Files:**
- Create: `features/auth/hooks/useCurrentUser.ts`
- Create: `features/auth/hooks/usePostSignUp.ts`
- Modify: `app/(auth)/sign-up.tsx`
- Modify: `app/(auth)/sign-up-email.tsx`

- [ ] **Step 1: Create `features/auth/hooks/useCurrentUser.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'

export function useCurrentUser() {
  const sb = useSupabase()
  const { userId, isSignedIn } = useAuth()

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!isSignedIn && !!userId,
  })
}
```

- [ ] **Step 2: Create `features/auth/hooks/usePostSignUp.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useAuth, useSession } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'

export function usePostSignUp() {
  const sb = useSupabase()
  const { userId } = useAuth()
  const { session } = useSession()

  async function handlePostSignUp(displayName: string) {
    // 1. Create profile row (username defaults to display name — user can edit later)
    const username = displayName.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000)
    const { error } = await sb.from('profiles').insert({
      id: userId!,
      username,
      display_name: displayName,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    if (error) throw error

    // 2. Invalidate profile cache
    queryClient.invalidateQueries({ queryKey: ['profile', userId] })

    // 3. Check for a pending invite (stored before sign-up redirect)
    const pendingCode = await AsyncStorage.getItem('pendingInvite')
    if (pendingCode) {
      try {
        const token = await session?.getToken({ template: 'supabase' })
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/accept-invite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ code: pendingCode }),
          }
        )
        if (!res.ok) console.warn('invite accept failed silently', await res.text())
      } catch (e) {
        console.warn('invite accept failed silently', e)
      }
      await AsyncStorage.removeItem('pendingInvite')
    }

    // 4. Continue to onboarding
    router.replace('/(onboarding)/pick-habit')
  }

  return { handlePostSignUp }
}
```

- [ ] **Step 3: Call `handlePostSignUp` in `app/(auth)/sign-up.tsx`**

In the existing `handleOAuth` function, after `setActive!({ session: createdSessionId })`, add the post-sign-up call. The display name comes from the OAuth profile — use the Clerk user object:

```tsx
// At top of file, add imports:
import { useUser } from '@clerk/expo'
import { usePostSignUp } from '@/features/auth/hooks/usePostSignUp'

// Inside SignUpScreen component, add:
const { user } = useUser()
const { handlePostSignUp } = usePostSignUp()

// Replace the existing handleOAuth function:
async function handleOAuth(start: ReturnType<typeof useOAuth>['startOAuthFlow']) {
  try {
    const { createdSessionId, setActive } = await start()
    if (createdSessionId) {
      await setActive!({ session: createdSessionId })
      const name = user?.fullName ?? user?.firstName ?? 'friend'
      await handlePostSignUp(name)
      // handlePostSignUp calls router.replace('/(onboarding)/pick-habit') internally
    }
  } catch (err) {
    console.error('OAuth error', err)
  }
}
```

- [ ] **Step 4: Call `handlePostSignUp` in `app/(auth)/sign-up-email.tsx`**

In the existing `handleVerify` function, after `setActive({ session: result.createdSessionId })`, add:

```tsx
// At top of file, add imports:
import { useUser } from '@clerk/expo'
import { usePostSignUp } from '@/features/auth/hooks/usePostSignUp'

// Inside SignUpEmailScreen component, add:
const { user } = useUser()
const { handlePostSignUp } = usePostSignUp()

// In handleVerify, replace router.replace('/(app)') with:
const name = user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'friend'
await handlePostSignUp(name)
```

- [ ] **Step 5: Commit**

```bash
git add features/auth/ app/(auth)/sign-up.tsx app/(auth)/sign-up-email.tsx
git commit -m "feat: add post-sign-up hook (profile creation + pending invite check)"
```

---

### Task 11: Friends + invite code hooks

**Files:**
- Create: `features/friends/hooks/keys.ts`
- Create: `features/friends/hooks/useFriends.ts`
- Create: `features/friends/hooks/useInviteCode.ts`
- Create: `features/friends/hooks/useAcceptInvite.ts`
- Test: `__tests__/features/friends/useInviteCode.test.tsx`

- [ ] **Step 1: Create `features/friends/hooks/keys.ts`**

```ts
export const friendKeys = {
  all:         ()           => ['friends']                   as const,
  list:        ()           => ['friends', 'list']           as const,
  inviteCode:  ()           => ['friends', 'invite-code']    as const,
}
```

- [ ] **Step 2: Write failing test for `useInviteCode`**

Create `__tests__/features/friends/useInviteCode.test.tsx`:

```tsx
import { renderHookWithQuery } from '../../test-utils'
import { useInviteCode } from '@/features/friends/hooks/useInviteCode'
import { waitFor } from '@testing-library/react-native'

const mockCode = { id: 'ic1', code: 'abc9', created_by: 'u1',
  accepted_by: null, expires_at: '2099-01-01', created_at: '2026-01-01' }

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ userId: 'u1', isSignedIn: true }),
}))

const mockFrom = jest.fn().mockReturnValue({
  select:  jest.fn().mockReturnThis(),
  eq:      jest.fn().mockReturnThis(),
  is:      jest.fn().mockReturnThis(),
  single:  jest.fn().mockResolvedValue({ data: mockCode, error: null }),
  insert:  jest.fn().mockReturnThis(),
  order:   jest.fn().mockReturnThis(),
  limit:   jest.fn().mockResolvedValue({ data: [mockCode], error: null }),
})

jest.mock('@/lib/SupabaseProvider', () => ({
  useSupabase: () => ({ from: mockFrom }),
}))

describe('useInviteCode', () => {
  it('returns an existing unused invite code for the current user', async () => {
    const { result } = renderHookWithQuery(() => useInviteCode())
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.code).toBe('abc9')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest __tests__/features/friends/useInviteCode.test.tsx
```

Expected: FAIL — `Cannot find module '@/features/friends/hooks/useInviteCode'`

- [ ] **Step 4: Create `features/friends/hooks/useFriends.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/SupabaseProvider'
import { friendKeys } from './keys'

export function useFriends() {
  const sb = useSupabase()
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: async () => {
      const { data, error } = await sb
        .from('friendships')
        .select(`
          id,
          created_at,
          user_a:profiles!friendships_user_a_id_fkey(*),
          user_b:profiles!friendships_user_b_id_fkey(*)
        `)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}
```

- [ ] **Step 5: Create `features/friends/hooks/useInviteCode.ts`**

```ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { queryClient } from '@/lib/queryClient'
import { friendKeys } from './keys'

function generateCode() {
  return Math.random().toString(36).slice(2, 6)
}

export function useInviteCode() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery({
    queryKey: friendKeys.inviteCode(),
    queryFn: async () => {
      // Return existing unused code if available
      const { data: existing } = await sb
        .from('invite_codes')
        .select('*')
        .eq('created_by', userId!)
        .is('accepted_by', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (existing && existing.length > 0) return existing[0]

      // Create a new one (expires in 7 days)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await sb
        .from('invite_codes')
        .insert({ code: generateCode(), created_by: userId!, expires_at: expiresAt })
        .select()
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}
```

- [ ] **Step 6: Create `features/friends/hooks/useAcceptInvite.ts`**

```ts
import { useMutation } from '@tanstack/react-query'
import { useSession } from '@clerk/expo'
import { queryClient } from '@/lib/queryClient'
import { friendKeys } from './keys'

export function useAcceptInvite() {
  const { session } = useSession()

  return useMutation({
    mutationFn: async (code: string) => {
      const token = await session?.getToken({ template: 'supabase' })
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/accept-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'failed to accept invite')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all() })
    },
  })
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npx jest __tests__/features/friends/useInviteCode.test.tsx
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add features/friends/ __tests__/features/friends/
git commit -m "feat: add friend and invite code hooks"
```

---

### Task 12: Check-in hooks

**Files:**
- Create: `features/check-in/hooks/keys.ts`
- Create: `features/check-in/hooks/useTodayStatus.ts`
- Create: `features/check-in/hooks/useCheckIn.ts`

- [ ] **Step 1: Create `features/check-in/hooks/keys.ts`**

```ts
export const checkInKeys = {
  all:          ()           => ['check-ins']                      as const,
  todayStatus:  ()           => ['check-ins', 'today-status']      as const,
  friendsToday: ()           => ['check-ins', 'friends-today']     as const,
  history:      (habitId: string) => ['check-ins', 'history', habitId] as const,
}
```

- [ ] **Step 2: Create `features/check-in/hooks/useTodayStatus.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'
import { checkInKeys } from './keys'

function toLocalDateString() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

export function useTodayStatus(habitId: string) {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useQuery({
    queryKey: [...checkInKeys.todayStatus(), habitId],
    queryFn: async () => {
      const { data, error } = await sb
        .from('check_ins')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', userId!)
        .eq('checked_date', toLocalDateString())
        .maybeSingle()
      if (error) throw error
      return data // null = not yet checked in today
    },
    enabled: !!habitId && !!userId,
  })
}
```

- [ ] **Step 3: Create `features/check-in/hooks/useCheckIn.ts`**

```ts
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
  type: 'done' | 'grace'
  photoUrl?: string
  note?: string
}

export function useCheckIn() {
  const sb = useSupabase()
  const { userId } = useAuth()

  return useMutation({
    mutationFn: async ({ habitId, type, photoUrl, note }: CheckInInput) => {
      const { data, error } = await sb
        .from('check_ins')
        .insert({
          habit_id: habitId,
          user_id: userId!,
          checked_date: toLocalDateString(),
          type,
          photo_url: photoUrl ?? null,
          note: note ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: [...checkInKeys.todayStatus(), habitId] })
      queryClient.invalidateQueries({ queryKey: checkInKeys.friendsToday() })
      queryClient.invalidateQueries({ queryKey: habitKeys.list() })
    },
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add features/check-in/
git commit -m "feat: add check-in hooks (useTodayStatus, useCheckIn)"
```

---

### Task 13: Push token registration hook

**Files:**
- Create: `features/notifications/hooks/useRegisterPushToken.ts`

- [ ] **Step 1: Create `features/notifications/hooks/useRegisterPushToken.ts`**

```ts
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { useAuth } from '@clerk/expo'
import { useSupabase } from '@/lib/SupabaseProvider'

export function useRegisterPushToken() {
  const sb = useSupabase()
  const { userId, isSignedIn } = useAuth()

  useEffect(() => {
    if (!isSignedIn || !userId) return

    async function register() {
      if (!Device.isDevice) return // simulators can't receive push

      const { status: existing } = await Notifications.getPermissionsAsync()
      const { status } = existing === 'granted'
        ? { status: existing }
        : await Notifications.requestPermissionsAsync()

      if (status !== 'granted') return

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        })
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync()

      await sb
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId)
    }

    register().catch(console.warn)
  }, [isSignedIn, userId, sb])
}
```

- [ ] **Step 2: Call the hook in the root layout**

In `app/_layout.tsx`, import and call the hook inside a new inner component so it has access to providers:

```tsx
// Add import:
import { useRegisterPushToken } from '@/features/notifications/hooks/useRegisterPushToken'

// Add this component above RootLayout:
function AppServices() {
  useRegisterPushToken()
  return null
}

// Inside the JSX, add <AppServices /> as a child of QueryClientProvider:
<QueryClientProvider client={queryClient}>
  <AppServices />
  <Stack screenOptions={{ headerShown: false }} />
</QueryClientProvider>
```

- [ ] **Step 3: Commit**

```bash
git add features/notifications/ app/_layout.tsx
git commit -m "feat: add push token registration on app open"
```

---

### Task 14: Routing guard + navigation structure

**Files:**
- Modify: `app/index.tsx`
- Create: `app/(onboarding)/_layout.tsx`
- Create: `app/(onboarding)/pick-habit.tsx`
- Create: `app/(onboarding)/invite.tsx`
- Modify: `app/(app)/_layout.tsx`
- Create: `app/(app)/(tabs)/_layout.tsx`
- Create: `app/(app)/(tabs)/index.tsx`
- Create: `app/(app)/(tabs)/friends.tsx`
- Create: `app/(app)/(tabs)/you.tsx`
- Create: `app/(app)/habits/[id].tsx`
- Create: `app/(app)/check-in/[habitId].tsx`

- [ ] **Step 1: Replace `app/index.tsx` with routing guard**

```tsx
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/expo'
import { ActivityIndicator, View } from 'react-native'
import { useHasHabit } from '@/features/habits/hooks/useHasHabit'
import { Colors } from '@/constants/theme'

export default function Guard() {
  const { isSignedIn, isLoaded } = useAuth()
  const { hasHabit, isLoading } = useHasHabit()

  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.ink} />
      </View>
    )
  }

  if (!isSignedIn)  return <Redirect href="/(auth)" />
  if (!hasHabit)    return <Redirect href="/(onboarding)/pick-habit" />
  return <Redirect href="/(app)" />
}
```

- [ ] **Step 2: Create `app/(onboarding)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />
  )
}
```

- [ ] **Step 3: Create `app/(onboarding)/pick-habit.tsx` stub**

```tsx
import { SafeAreaView, Text } from 'react-native'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function PickHabitScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>
        pick habit — coming soon
      </Text>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Create `app/(onboarding)/invite.tsx` stub**

```tsx
import { SafeAreaView, Text } from 'react-native'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function InviteScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>
        invite — coming soon
      </Text>
    </SafeAreaView>
  )
}
```

- [ ] **Step 5: Update `app/(app)/_layout.tsx` to add modal + habit detail screens**

```tsx
import { Stack } from 'expo-router'
import { Colors } from '@/constants/theme'

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="habits/[id]" />
      <Stack.Screen name="check-in/[habitId]" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
```

- [ ] **Step 6: Create `app/(app)/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.ink,
        tabBarInactiveTintColor: Colors.ink3,
        tabBarStyle: { backgroundColor: Colors.bg, borderTopColor: Colors.line },
        tabBarLabelStyle: { fontFamily: Fonts.mono, fontSize: FontSizes.xs, textTransform: 'lowercase' },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'today' }} />
      <Tabs.Screen name="friends" options={{ title: 'friends' }} />
      <Tabs.Screen name="you"     options={{ title: 'you' }} />
    </Tabs>
  )
}
```

- [ ] **Step 7: Create stub screens for all three tabs and pushed screens**

`app/(app)/(tabs)/index.tsx`:

```tsx
import { SafeAreaView, Text } from 'react-native'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function TodayScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>today</Text>
    </SafeAreaView>
  )
}
```

`app/(app)/(tabs)/friends.tsx`:

```tsx
import { SafeAreaView, Text } from 'react-native'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function FriendsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>friends</Text>
    </SafeAreaView>
  )
}
```

`app/(app)/(tabs)/you.tsx`:

```tsx
import { SafeAreaView, Text } from 'react-native'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function YouScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>you</Text>
    </SafeAreaView>
  )
}
```

`app/(app)/habits/[id].tsx`:

```tsx
import { SafeAreaView, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>habit {id}</Text>
    </SafeAreaView>
  )
}
```

`app/(app)/check-in/[habitId].tsx`:

```tsx
import { SafeAreaView, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Colors, Fonts, FontSizes } from '@/constants/theme'

export default function CheckInModal() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.h3, color: Colors.ink }}>check in {habitId}</Text>
    </SafeAreaView>
  )
}
```

- [ ] **Step 8: Update `app.json` with scheme and universal link domain**

In `app.json`, add inside `"expo"`:

```json
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
```

- [ ] **Step 9: Smoke-test the navigation**

```bash
npx expo start --ios
```

Walk through manually:
1. Not signed in → lands on welcome screen ✓
2. Sign up with email → goes through OTP → hits onboarding stub ("pick habit — coming soon") ✓
3. If already signed in with a habit → tab bar appears with Today · Friends · You ✓

- [ ] **Step 10: Commit**

```bash
git add app/ app.json
git commit -m "feat: add routing guard and full navigation structure with stub screens"
```

---

### Task 15: Invite deep link handler + Edge Function

**Files:**
- Create: `app/j/[code].tsx`
- Create: `supabase/functions/accept-invite/index.ts`
- Test: `__tests__/app/j/[code].test.tsx`

- [ ] **Step 1: Write failing test for the deep link handler**

Create `__tests__/app/j/[code].test.tsx`:

```tsx
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ code: 'test99' }),
  Redirect: ({ href }: { href: string }) => null,
  router: { replace: jest.fn() },
}))

jest.mock('@clerk/expo', () => ({
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
}))

jest.mock('@/features/friends/hooks/useAcceptInvite', () => ({
  useAcceptInvite: () => ({ mutateAsync: jest.fn() }),
}))

// Import after mocks
const { default: InvitePage } = require('@/app/j/[code]')

describe('app/j/[code]', () => {
  beforeEach(() => AsyncStorage.clear())

  it('stores the invite code in AsyncStorage when user is not signed in', async () => {
    render(<InvitePage />)
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('pendingInvite')
      expect(stored).toBe('test99')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest "__tests__/app/j/\[code\].test.tsx"
```

Expected: FAIL — `Cannot find module '@/app/j/[code]'`

- [ ] **Step 3: Create `app/j/[code].tsx`**

```tsx
import { useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuth } from '@clerk/expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View, ActivityIndicator } from 'react-native'
import { useAcceptInvite } from '@/features/friends/hooks/useAcceptInvite'
import { Colors } from '@/constants/theme'

export default function InvitePage() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { isSignedIn, isLoaded } = useAuth()
  const { mutateAsync: acceptInvite } = useAcceptInvite()

  useEffect(() => {
    if (!isLoaded || !code) return

    async function handle() {
      if (isSignedIn) {
        try {
          await acceptInvite(code)
        } catch (e) {
          console.warn('invite accept failed', e)
        }
        router.replace('/(app)')
      } else {
        await AsyncStorage.setItem('pendingInvite', code)
        router.replace('/(auth)/sign-up')
      }
    }

    handle()
  }, [isLoaded, isSignedIn, code])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.ink} />
    </View>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest "__tests__/app/j/\[code\].test.tsx"
```

Expected: PASS

- [ ] **Step 5: Create `supabase/functions/accept-invite/index.ts`**

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Extract calling user from the Clerk JWT in the Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  // Decode the JWT to get the sub (Clerk user ID)
  const token = authHeader.replace('Bearer ', '')
  const [, payloadB64] = token.split('.')
  const payload = JSON.parse(atob(payloadB64))
  const userId: string = payload.sub

  const { code } = await req.json()
  if (!code) {
    return new Response(JSON.stringify({ error: 'code required' }), { status: 400 })
  }

  // 1. Validate the invite code
  const { data: invite, error: inviteError } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .single()

  if (inviteError || !invite) {
    return new Response(JSON.stringify({ error: 'invalid-code' }), { status: 404 })
  }
  if (invite.accepted_by) {
    return new Response(JSON.stringify({ error: 'already-used' }), { status: 409 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: 'expired' }), { status: 410 })
  }
  if (invite.created_by === userId) {
    return new Response(JSON.stringify({ error: 'cannot-self-invite' }), { status: 422 })
  }

  // 2. Insert friendship (canonical ordering)
  const [userA, userB] = [userId, invite.created_by].sort()
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert({ user_a_id: userA, user_b_id: userB })

  if (friendshipError && friendshipError.code !== '23505') { // ignore duplicate
    return new Response(JSON.stringify({ error: 'friendship-failed' }), { status: 500 })
  }

  // 3. Mark invite as used
  await supabase
    .from('invite_codes')
    .update({ accepted_by: userId })
    .eq('id', invite.id)

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
```

- [ ] **Step 6: Deploy the Edge Function**

```bash
supabase functions deploy accept-invite
```

Expected: `Deployed Function accept-invite`

- [ ] **Step 7: Commit**

```bash
git add app/j/ supabase/functions/ __tests__/app/
git commit -m "feat: add invite deep link handler and accept-invite Edge Function"
```

---

### Task 16: Vercel web project for universal links

**Files:**
- Create: `web/package.json`
- Create: `web/vercel.json`
- Create: `web/pages/j/[code].tsx`
- Create: `web/public/.well-known/apple-app-site-association`
- Create: `web/public/.well-known/assetlinks.json`

- [ ] **Step 1: Create `web/package.json`**

```json
{
  "name": "togezer-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

- [ ] **Step 2: Install web dependencies**

```bash
cd web && npm install && cd ..
```

- [ ] **Step 3: Create `web/vercel.json`**

```json
{
  "headers": [
    {
      "source": "/.well-known/(.*)",
      "headers": [{ "key": "Content-Type", "value": "application/json" }]
    }
  ]
}
```

- [ ] **Step 4: Create the iOS universal link file**

Create `web/public/.well-known/apple-app-site-association`. Replace `TEAMID` with your Apple Team ID (found in developer.apple.com → Membership):

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAMID.app.togezer"],
        "components": [{ "/": "/j/*" }]
      }
    ]
  }
}
```

- [ ] **Step 5: Create the Android App Links file**

Create `web/public/.well-known/assetlinks.json`. Replace the SHA-256 fingerprint with your release keystore fingerprint (generated with `keytool -list -v -keystore release.keystore`):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "app.togezer",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  }
]
```

- [ ] **Step 6: Create the redirect page `web/pages/j/[code].tsx`**

```tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function InviteRedirect() {
  const { query } = useRouter()
  const code = query.code as string

  useEffect(() => {
    if (!code) return
    // Try to open the native app via custom scheme
    window.location.href = `togezer://j/${code}`

    // After 2s, if the app didn't open, redirect to App Store
    setTimeout(() => {
      window.location.href = 'https://apps.apple.com/app/togezer/id000000000'
    }, 2000)
  }, [code])

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: 80 }}>
      <h1>Opening togezer…</h1>
      <p>If nothing happens, <a href="https://apps.apple.com/app/togezer/id000000000">download the app</a>.</p>
    </div>
  )
}
```

- [ ] **Step 7: Deploy to Vercel**

```bash
cd web
npx vercel --prod
```

During setup: name the project `togezer` so the URL becomes `togezer.vercel.app`. If that name is taken, update `app.json` accordingly.

Expected: deployment URL printed, `.well-known` files accessible at `https://togezer.vercel.app/.well-known/apple-app-site-association`.

- [ ] **Step 8: Verify the `.well-known` files are reachable**

```bash
curl https://togezer.vercel.app/.well-known/apple-app-site-association
```

Expected: the JSON you wrote in Step 4.

- [ ] **Step 9: Commit**

```bash
cd ..
git add web/
git commit -m "feat: add Vercel web project for universal link redirect and .well-known files"
```

---

### Task 17: Full test run + final commit

- [ ] **Step 1: Run all tests**

```bash
npx jest
```

Expected: all test suites pass. No failures.

- [ ] **Step 2: Run linter**

```bash
npx expo lint
```

Expected: no errors (warnings are OK).

- [ ] **Step 3: Smoke-test the full sign-up flow on device**

On a physical iOS device (or TestFlight build):
1. Fresh install — open app → welcome screen
2. Sign up with email → OTP → onboarding stub screen appears
3. Check Supabase dashboard → `profiles` table has your row ✓
4. Kill and reopen app → tab bar appears (routed to `/(app)`) ✓
5. Open `https://togezer.vercel.app/j/test` in Safari on the same device → app opens to the invite handler ✓

- [ ] **Step 4: Tag the foundation complete**

```bash
git tag v0.1-foundation
```

---

## What comes next (separate plans)

- **Screen implementation plan** — build out pick-habit, invite, today/home, check-in modal, habit detail, friends list, you/profile using the hooks defined here
- **GCP notification plan** — Cloud Scheduler + Cloud Function that queries `profiles.push_token` + `habits.reminder_time` and fans out streak-risk push notifications via Expo Push API
