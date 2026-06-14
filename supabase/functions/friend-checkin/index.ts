import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPush, type PushMessage } from '../_shared/push.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Shared secret guards this function — it's invoked by a DB trigger, not a user.
const CRON_SECRET = Deno.env.get('CRON_SECRET')!

type CheckInRecord = {
  user_id: string
  habit_id: string
}

serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  const { record } = (await req.json()) as { record?: CheckInRecord }
  if (!record?.user_id || !record?.habit_id) {
    return new Response(JSON.stringify({ error: 'record required' }), { status: 400 })
  }

  const checkerId = record.user_id

  // Who checked in, and which habit.
  const [{ data: checker }, { data: habit }] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', checkerId).single(),
    supabase.from('habits').select('title, emoji').eq('id', record.habit_id).single(),
  ])

  if (!checker || !habit) {
    return new Response(JSON.stringify({ error: 'not-found' }), { status: 404 })
  }

  // Friends of the checker (canonical ordering means they're on either side).
  const { data: friendships, error: friendshipError } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${checkerId},user_b_id.eq.${checkerId}`)

  if (friendshipError) {
    return new Response(JSON.stringify({ error: friendshipError.message }), { status: 500 })
  }

  const friendIds = (friendships ?? []).map((f) =>
    f.user_a_id === checkerId ? f.user_b_id : f.user_a_id
  )

  if (friendIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 })
  }

  const { data: friends, error: friendsError } = await supabase
    .from('profiles')
    .select('push_token')
    .in('id', friendIds)

  if (friendsError) {
    return new Response(JSON.stringify({ error: friendsError.message }), { status: 500 })
  }

  const label = [habit.emoji, habit.title].filter(Boolean).join(' ')
  const messages: PushMessage[] = (friends ?? [])
    .filter((f) => f.push_token)
    .map((f) => ({
      to: f.push_token as string,
      title: '✅ Streak alert',
      body: `${checker.display_name} just completed ${label || 'their habit'}.`,
      data: { type: 'friend_checkin', fromUserId: checkerId, habitId: record.habit_id },
    }))

  const tickets = await sendPush(messages)

  return new Response(
    JSON.stringify({ ok: true, sent: messages.length, tickets }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
