import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const [, payloadB64] = token.split('.')
  const payload = JSON.parse(atob(payloadB64))
  const userId: string = payload.sub

  const { code } = await req.json()
  if (!code) {
    return new Response(JSON.stringify({ error: 'code required' }), { status: 400 })
  }

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

  const [userA, userB] = [userId, invite.created_by].sort()
  const { error: friendshipError } = await supabase
    .from('friendships')
    .insert({ user_a_id: userA, user_b_id: userB })

  if (friendshipError && friendshipError.code !== '23505') {
    return new Response(JSON.stringify({ error: 'friendship-failed' }), { status: 500 })
  }

  await supabase
    .from('invite_codes')
    .update({ accepted_by: userId })
    .eq('id', invite.id)

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
