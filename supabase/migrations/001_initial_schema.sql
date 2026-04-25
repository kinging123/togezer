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
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id  text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id  text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);

-- invite_codes
CREATE TABLE invite_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  created_by  text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_by text REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- nudges — schema defined now, feature deferred
CREATE TABLE nudges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_id     uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX nudges_one_per_day ON nudges (from_user_id, to_user_id, habit_id, (created_at::date));

-- reactions — schema defined now, feature deferred
CREATE TABLE reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  user_id     text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (check_in_id, user_id, emoji)
);
