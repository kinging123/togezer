// Dev-only: seed fake friends (profile + habit + check-ins + friendship) so the
// Today "your gang" feed populates without needing real second logins.
// Uses the Supabase service-role key from .env (bypasses RLS). Idempotent:
// deleting each seed profile cascades to its habits/check-ins/friendships.
//
// Run:  node scripts/seed-test-friends.mjs
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const ME = 'user_3CqsSGURpgFWnCinNZYphZvWm5s' // Reuven

const dateStr = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toLocaleDateString('en-CA')
}

const friends = [
  { id: 'seed_maya', username: 'maya_seed', name: 'maya', emoji: '🧘', title: 'meditate', days: [0, 1, 2, 3, 4] }, // checked in today → ✅, streak 5
  { id: 'seed_jonas', username: 'jonas_seed', name: 'jonas', emoji: '📖', title: 'read 20 min', days: [1, 2, 3] }, // not today → ⬜, streak 3
]

async function main() {
  for (const f of friends) {
    // Clean slate (cascades to habits/check_ins/friendships via FK ON DELETE CASCADE).
    await sb.from('profiles').delete().eq('id', f.id)

    await sb.from('profiles').insert({ id: f.id, username: f.username, display_name: f.name, timezone: 'UTC' })

    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - 60)
    const { data: habit, error: hErr } = await sb
      .from('habits')
      .insert({ user_id: f.id, title: f.title, emoji: f.emoji, grace_days_pw: 1, created_at: createdAt.toISOString() })
      .select()
      .single()
    if (hErr) throw hErr

    const checkIns = f.days.map((off) => ({
      habit_id: habit.id,
      user_id: f.id,
      checked_date: dateStr(off),
      type: 'done',
    }))
    const { error: cErr } = await sb.from('check_ins').insert(checkIns)
    if (cErr) throw cErr

    const [a, b] = [ME, f.id].sort() // canonical ordering: user_a_id < user_b_id
    const { error: fErr } = await sb.from('friendships').insert({ user_a_id: a, user_b_id: b })
    if (fErr) throw fErr

    console.log(`seeded ${f.name}: ${f.title} ${f.emoji}, ${f.days.length} check-ins, friended`)
  }
  console.log('done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
