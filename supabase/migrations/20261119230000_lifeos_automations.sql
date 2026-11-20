alter table public.user_preferences
  add column automation_enabled boolean not null default false,
  add column ai_weekly_summary_enabled boolean not null default false,
  add constraint user_preferences_ai_automation_requires_automation
    check (not ai_weekly_summary_enabled or automation_enabled);

alter table public.focus_sessions
  add column planned_duration_seconds integer,
  add column remaining_seconds integer,
  add column paused_at timestamptz,
  add column resumed_at timestamptz,
  add constraint focus_sessions_planned_duration_check
    check (planned_duration_seconds is null or planned_duration_seconds between 1 and 86400),
  add constraint focus_sessions_remaining_duration_check
    check (
      remaining_seconds is null
      or (
        remaining_seconds >= 0
        and (planned_duration_seconds is null or remaining_seconds <= planned_duration_seconds)
      )
    );

update public.focus_sessions
set resumed_at = started_at
where ended_at is null and paused_at is null and resumed_at is null;

alter table public.tasks
  add column ai_proposal_id uuid;

alter table public.calendar_events
  add column ai_proposal_id uuid;

create unique index tasks_user_ai_proposal_idx
  on public.tasks (user_id, ai_proposal_id)
  where ai_proposal_id is not null;

create unique index calendar_events_user_ai_proposal_idx
  on public.calendar_events (user_id, ai_proposal_id)
  where ai_proposal_id is not null;

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null check (char_length(event_key) between 1 and 255),
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

alter table public.automation_runs enable row level security;
revoke all on public.automation_runs from public, anon, authenticated;
grant all on public.automation_runs to service_role;

create function public.update_automation_preferences(
  p_automation_enabled boolean,
  p_ai_weekly_summary_enabled boolean,
  p_timezone text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to update automation preferences.' using errcode = '28000';
  end if;

  if p_automation_enabled is null or p_ai_weekly_summary_enabled is null then
    raise exception 'Automation preferences must be explicitly enabled or disabled.' using errcode = '22023';
  end if;

  if p_ai_weekly_summary_enabled and not p_automation_enabled then
    raise exception 'Enable automations before enabling AI summaries.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_timezone, ''))) not between 1 and 80
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = trim(p_timezone)
    )
  then
    raise exception 'Choose a valid time zone.' using errcode = '22023';
  end if;

  update public.user_preferences
  set automation_enabled = p_automation_enabled,
      ai_weekly_summary_enabled = p_ai_weekly_summary_enabled,
      timezone = trim(p_timezone)
  where user_id = current_user_id;

  if not found then
    raise exception 'User preferences are missing. Reload and try again.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.update_automation_preferences(boolean, boolean, text) from public, anon;
grant execute on function public.update_automation_preferences(boolean, boolean, text) to authenticated;

create function public.create_automation_notification(
  p_user_id uuid,
  p_event_key text,
  p_title text,
  p_body text,
  p_notification_type text,
  p_action_url text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Automation service authorization is required.' using errcode = '42501';
  end if;

  if char_length(trim(coalesce(p_event_key, ''))) not between 1 and 255 then
    raise exception 'Automation event key is invalid.' using errcode = '22023';
  end if;

  if char_length(trim(coalesce(p_title, ''))) not between 1 and 180 then
    raise exception 'Automation notification title is invalid.' using errcode = '22023';
  end if;

  if p_action_url is not null and (p_action_url not like '/%' or p_action_url like '//%') then
    raise exception 'Automation action URL must be a local path.' using errcode = '22023';
  end if;

  insert into public.automation_runs (user_id, event_key)
  values (p_user_id, p_event_key)
  on conflict (user_id, event_key) do nothing;

  if not found then
    return false;
  end if;

  insert into public.notifications (user_id, title, body, notification_type, action_url)
  values (
    p_user_id,
    trim(p_title),
    coalesce(p_body, ''),
    coalesce(nullif(trim(p_notification_type), ''), 'automation'),
    p_action_url
  );

  return true;
end;
$$;

revoke all on function public.create_automation_notification(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_automation_notification(uuid, text, text, text, text, text) to service_role;
