-- Enable RLS on every table
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions   ENABLE ROW LEVEL SECURITY;

-- profiles: own row + friends' rows (needed for home screen avatar/name)
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = (auth.jwt() ->> 'sub'));

CREATE POLICY "profiles_friends_read" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = (auth.jwt() ->> 'sub') AND user_b_id = profiles.id)
         OR (user_b_id = (auth.jwt() ->> 'sub') AND user_a_id = profiles.id)
    )
  );

-- habits: own + friends' (read-only for friends)
CREATE POLICY "habits_own" ON habits
  FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "habits_friends_read" ON habits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = (auth.jwt() ->> 'sub') AND user_b_id = habits.user_id)
         OR (user_b_id = (auth.jwt() ->> 'sub') AND user_a_id = habits.user_id)
    )
  );

-- check_ins: own + friends' (read-only for friends)
CREATE POLICY "check_ins_own" ON check_ins
  FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "check_ins_friends_read" ON check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_a_id = (auth.jwt() ->> 'sub') AND user_b_id = check_ins.user_id)
         OR (user_b_id = (auth.jwt() ->> 'sub') AND user_a_id = check_ins.user_id)
    )
  );

-- friendships: see your own connections
CREATE POLICY "friendships_own" ON friendships
  FOR SELECT USING (
    user_a_id = (auth.jwt() ->> 'sub') OR user_b_id = (auth.jwt() ->> 'sub')
  );

-- invite_codes: create + read your own
CREATE POLICY "invite_codes_own_read" ON invite_codes
  FOR SELECT USING (created_by = (auth.jwt() ->> 'sub'));

CREATE POLICY "invite_codes_own_insert" ON invite_codes
  FOR INSERT WITH CHECK (created_by = (auth.jwt() ->> 'sub'));

-- nudges: send + receive
CREATE POLICY "nudges_sent" ON nudges
  FOR ALL USING (from_user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "nudges_received_read" ON nudges
  FOR SELECT USING (to_user_id = (auth.jwt() ->> 'sub'));

-- reactions: own + friends' check-in reactions
CREATE POLICY "reactions_own" ON reactions
  FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "reactions_friends_read" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM check_ins
      WHERE check_ins.id = reactions.check_in_id
        AND EXISTS (
          SELECT 1 FROM friendships
          WHERE (user_a_id = (auth.jwt() ->> 'sub') AND user_b_id = check_ins.user_id)
             OR (user_b_id = (auth.jwt() ->> 'sub') AND user_a_id = check_ins.user_id)
        )
    )
  );
