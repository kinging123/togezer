import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPush, type PushMessage } from '../_shared/push.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Shared secret guards this function — it's invoked by pg_cron, not by a user.
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

// "Today" in Israel time. Reminder time itself (10:00) is enforced by the cron
// schedule; here we only need the correct calendar date to detect check-ins.
function todayInIsrael(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
  }).format(new Date())
}

serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  const today = todayInIsrael()

  // Active habits with their owner's push token.
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, title, emoji, user_id, profiles!inner(push_token)')
    .eq('is_archived', false)

  if (habitsError) {
    return new Response(JSON.stringify({ error: habitsError.message }), { status: 500 })
  }

  // Habits already checked in today — these users don't need a nudge.
  const { data: checkedToday, error: checkInError } = await supabase
    .from('check_ins')
    .select('habit_id')
    .eq('checked_date', today)

  if (checkInError) {
    return new Response(JSON.stringify({ error: checkInError.message }), { status: 500 })
  }

  const doneHabitIds = new Set((checkedToday ?? []).map((c) => c.habit_id))

  // One reminder per user, even if they somehow have multiple pending habits.
  const seenUsers = new Set<string>()
  const messages: PushMessage[] = []

  for (const habit of habits ?? []) {
    const token = (habit.profiles as { push_token: string | null } | null)?.push_token
    if (!token) continue
    if (doneHabitIds.has(habit.id)) continue
    if (seenUsers.has(habit.user_id)) continue

    seenUsers.add(habit.user_id)
    const label = [habit.emoji, habit.title].filter(Boolean).join(' ')
    messages.push({
      to: token,
      title: '🎯 Don\'t forget',
      body: `Time to do ${label || 'your habit'} today.`,
      data: { type: 'reminder', habitId: habit.id },
    })
  }

  const tickets = await sendPush(messages)

  return new Response(
    JSON.stringify({ ok: true, sent: messages.length, tickets }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
