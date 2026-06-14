-- Push notifications: daily habit reminder (pg_cron) + friend check-in (trigger).
-- Both call Supabase Edge Functions over HTTP via pg_net.
--
-- PREREQUISITE — create these two secrets in Supabase Vault before this runs
-- (Dashboard → Project Settings → Vault, or `select vault.create_secret(...)`):
--   * functions_base_url  e.g. 'https://<project-ref>.supabase.co/functions/v1'
--   * cron_secret         a long random string; set the same value as the
--                         CRON_SECRET env var on the edge functions.
-- Secrets are intentionally NOT committed here.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- Friend check-in: notify a user's friends whenever they insert a check-in.
-- ---------------------------------------------------------------------------
create or replace function notify_friend_checkin()
returns trigger
language plpgsql
security definer
as $$
declare
  fn_url text;
  secret text;
begin
  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'functions_base_url';
  select decrypted_secret into secret
    from vault.decrypted_secrets where name = 'cron_secret';

  -- Notification wiring must never block a check-in. Bail out if it isn't
  -- configured yet, and swallow any delivery error.
  if fn_url is null or secret is null then
    return NEW;
  end if;

  begin
    perform net.http_post(
      url := fn_url || '/friend-checkin',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', secret
      ),
      body := jsonb_build_object('record', to_jsonb(NEW))
    );
  exception when others then
    raise warning 'friend-checkin notify failed: %', sqlerrm;
  end;

  return NEW;
end;
$$;

drop trigger if exists on_check_in_created on check_ins;
create trigger on_check_in_created
  after insert on check_ins
  for each row execute function notify_friend_checkin();

-- ---------------------------------------------------------------------------
-- Daily reminder: fire the daily-reminder function at 10:00 Israel time.
--
-- pg_cron runs in UTC. 07:00 UTC = 10:00 IDT (Israel summer time, UTC+3).
-- DST CAVEAT: when Israel switches to standard time (UTC+2, ~late Oct–Mar)
-- this lands at 09:00 local. Acceptable while the time is hardcoded; the
-- follow-up is to schedule per-user off profiles.timezone instead.
-- ---------------------------------------------------------------------------
select cron.schedule(
  'daily-habit-reminder',
  '0 7 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_base_url') || '/daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
