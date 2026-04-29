# Onboarding Screens Design

**Goal:** Implement the two onboarding screens that take a new user from sign-up to their first habit + invite link.

**Architecture:** Two screens (`pick-habit`, `invite`) in `app/(onboarding)/`. The schedule screen is deferred — cadence is hardcoded to `daily` for MVP. Each screen has a single responsibility and no shared state between them.

**Tech Stack:** Expo Router, React Native, `@tanstack/react-query`, `expo-clipboard`, React Native `Share`, existing `useCreateHabit` + `useInviteCode` hooks.

---

## Flow

```
sign-up (usePostSignUp) → /(onboarding)/pick-habit → /(onboarding)/invite → /(app)
```

- `app/index.tsx` guard redirects to `/(onboarding)/pick-habit` when `isSignedIn && !hasHabit`
- Both "continue →" and "skip — go solo" on the invite screen call `router.replace('/(app)')`
- `/(onboarding)/schedule` is not implemented; step labels show "step 1 of 2" and "step 2 of 2" (the schedule step is simply absent from the user's experience for now)

---

## Screen 1: pick-habit (`app/(onboarding)/pick-habit.tsx`)

### Purpose
User names their first habit. They can type a custom name or tap a preset chip that fills both the title and emoji fields.

### State
```ts
title: string        // trimmed before submit
emoji: string | null // set by preset tap; null for custom input
```

### Preset list
| Emoji | Title |
|-------|-------|
| 🏃 | move body |
| 📖 | read 20 min |
| 📓 | journal |
| 💧 | drink water |
| 🧘 | meditate |

### Behaviour
- **Preset tap** — fills `title` with the preset's title string and `emoji` with its emoji character. The tapped chip highlights (filled ink style); previous chip deselects. The text input shows the filled value and remains editable.
- **Custom typing** — clears any active chip selection; sets `emoji` to `null`.
- **Emoji slot placeholder** — shows `✦` glyph when `emoji` is null (i.e. custom input or nothing yet typed).
- **"next →" button** — disabled while `title.trim()` is empty or while the mutation is in-flight (shows `ActivityIndicator`).
- **On submit** — calls `useCreateHabit({ title: title.trim(), emoji, cadence: 'daily' })`. On success: `router.push('/(onboarding)/invite')`. On error: shows inline error message below the input; button re-enables.

### Layout
- `SafeAreaView` + `KeyboardAvoidingView`
- `lbl` — "step 1 of 2"
- `headline` — "what are you trying to do?"
- `sub` — "pick a preset or type your own."
- `TextInput` — bordered pill, autoCapitalize none, returnKeyType "next"; emoji slot on left
- Preset chips — vertical list of bordered rows, each with emoji + title + `+` / `✓` indicator
- Spacer fills remaining height
- "next →" `Button` (variant="primary") at bottom

---

## Screen 2: invite (`app/(onboarding)/invite.tsx`)

### Purpose
User gets their invite link and can copy or share it. No friends list is shown (user has zero friends at this point).

### Data
- `useInviteCode()` — called on mount; fetches existing unused code or inserts a new one. Returns a `useQuery` result; the code string is at `data.code`. Destructure as `{ data, isLoading, isError, refetch }`.
- Full invite URL: `https://togezer.vercel.app/j/{code}`

### Behaviour
- **On mount** — `useInviteCode()` fetches/creates the code. Copy + continue buttons are disabled while loading.
- **Copy button** — writes full URL to clipboard via `Clipboard.setStringAsync()` from `expo-clipboard`. Button label changes to "copied ✓" and background flips to accent color for 2 seconds, then resets.
- **Share → button** — calls `Share.share({ message: url })` from `react-native`. Opens native share sheet.
- **"continue →"** — `router.replace('/(app)')`
- **"skip — go solo"** — `router.replace('/(app)')` (identical destination, lower visual emphasis)
- **Error state** — if `useInviteCode` fails, show a small inline error with a "retry" tap target below the invite card.

### Layout
- `SafeAreaView`
- `lbl` — "step 2 of 2"
- `headline` — "bring the gang."
- `sub` — "you'll see their streaks. they'll see yours."
- Invite card (bordered box):
  - `lbl` — "your invite link" + "copied!" badge (accent pill, shown for 2s after copy)
  - URL display — monospace, bordered inner box, ellipsis overflow
  - Button row — "copy" (ink filled) + "share →" (outline), side by side
  - Hint text — "drop it in whatsapp, imessage, wherever your gang lives"
- Spacer
- "continue →" `Button` (variant="primary")
- "skip — go solo" plain text link (centered, ink3 color)

---

## Files Changed

| File | Action |
|------|--------|
| `app/(onboarding)/pick-habit.tsx` | Replace stub with full implementation |
| `app/(onboarding)/invite.tsx` | Replace stub with full implementation |
| `features/friends/hooks/useInviteCode.ts` | Verify auto-creates code if none; no changes expected |

No new files. No new hooks. No schema changes.

---

## Testing

### pick-habit
- Tapping a preset chip fills the text input and highlights the chip
- Tapping a second preset replaces the first (only one chip active at a time)
- Typing clears active chip; emoji becomes null
- "next →" is disabled when input is empty
- Submit calls `useCreateHabit` with `{ title, emoji, cadence: 'daily' }`
- On success, routes to `/(onboarding)/invite`
- On error, shows inline error and re-enables button

### invite
- `useInviteCode` is called on mount
- Copy writes `https://togezer.vercel.app/j/{code}` to clipboard
- Copy button shows "copied ✓" for 2s then resets
- Share opens native share sheet with the URL
- Continue and skip both navigate to `/(app)`
- Error state shows retry option
