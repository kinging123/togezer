# togezer

habits, but with the gang.

a social habit-tracking app where you and your close friends hold each other accountable — one check-in a day, no scroll trap, no shame spiral. think duolingo streaks crossed with bereal.

---

## what it is

you pick a habit (meditate, read, move your body, whatever). you check in once a day. your close friends see your streak. you see theirs. you react, you nudge, you stay consistent — together.

the rules:

- **mutual-add only** — friends have to accept each other. no follower/following asymmetry.
- **one grace day per week** — skipping once doesn't break your streak.
- **one nudge per friend** — you can poke a friend who's about to miss a day. once. not spam.
- **warmth over guilt** — when a streak breaks, the app meets you with a restart button, not a shame screen.

---

## user stories

| #   | story                                                                                           |
| --- | ----------------------------------------------------------------------------------------------- |
| 01  | as a **new user**, i can pick one habit, set a cadence, and invite a friend in under 2 minutes. |
| 02  | as a **daily user**, i open togezer once, check in, and leave. no feed loop, no scroll trap.    |
| 03  | as a **proof-poster**, i can snap a quick photo (or skip it) to mark my habit done.             |
| 04  | as a **friend**, i can see my close circle's streaks today, and react or comment in one tap.    |
| 05  | as a **slacker**, i get one grace day per week that doesn't break my streak.                    |
| 06  | as a **streak-holder**, i get one gentle nudge before midnight if i haven't checked in.         |
| 07  | as a **friend**, i can nudge a friend who's about to break their streak — once, not spam.       |
| 08  | as a **pair**, i can join a friend's habit and run a paired streak together.                    |
| 09  | as a **returning user**, i can see a history of receipts (photos + notes) for each habit.       |
| 10  | as a **human**, when i break a streak i'm met with warmth, not shame — and a one-tap restart.   |

---

## screens

### flow 01 — onboarding

welcome → sign up → pick habit → cadence → invite. five screens, under 2 minutes, ends at a shareable invite link so your first check-in already has an audience.

### flow 02 — daily check-in

the core loop. a single yes/no for each habit. grace day is one tap away. ends at a +1 confirmation.

### flow 03 — home / today

your streaks sit at the top in an ink card. below it: each friend's avatar, their habits, and a streak-dot row. scannable, scroll-light. "4 of 5 checked in" is all the peer pressure you need.

### flow 04 — habit detail

tap any habit to see its full history. stats + calendar heatmap.

### flow 05 — streak at risk

the highest-emotion moment. three temperatures: ticking-clock (midnight approaching), friend nudge (someone poked you), and the morning-after (already broken, restart is right there).

### web companion

read-mostly. view your streaks and friends' progress without a phone in hand. no camera, no primary check-in — the dashboard you'd open at work.

---

## tech stack

| layer         | choice                                                          |
| ------------- | --------------------------------------------------------------- |
| framework     | Expo SDK 54, New Architecture (Fabric + JSI)                    |
| routing       | Expo Router — file-based, web + native from one codebase        |
| animations    | React Native Reanimated 4 + Gesture Handler                     |
| auth          | Clerk (`@clerk/expo`) — Google, Apple, and more                 |
| notifications | expo-notifications + expo-device                                |
| fonts         | Space Grotesk (display + body) · JetBrains Mono (labels + mono) |

---

## design system

**palette** — warm paper (`#F5F1E8`) · near-black ink (`#17150F`) · red-orange punch (`#FF4A1C`)

**vibe** — swiss poster meets gen-z group chat. bold chunky sans, hard offset shadows, lowercase copy, habits as atoms, friends as a primitive.

---

## running locally

```bash
npm install
```

```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # browser at localhost:8081
```

or install **Expo Go** on your phone, run `npm start`, and scan the QR code.

### environment variables

create a `.env` file (already gitignored):

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

get your keys at [clerk.com](https://clerk.com). you'll also need a project on [expo.dev](https://expo.dev) for production push notifications.
