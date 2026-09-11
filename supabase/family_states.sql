create table if not exists public.family_states (
  user_id uuid references auth.users(id) on delete cascade,
  family_email text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_states
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.family_states
  add column if not exists family_email text;

alter table public.family_states
  add column if not exists state jsonb not null default '{}'::jsonb;

alter table public.family_states
  add column if not exists created_at timestamptz not null default now();

alter table public.family_states
  add column if not exists updated_at timestamptz not null default now();

alter table public.family_states
  alter column user_id set not null,
  alter column family_email set not null,
  alter column state set not null;

alter table public.family_states
  drop constraint if exists family_states_pkey,
  drop constraint if exists family_states_family_email_normalized;

alter table public.family_states
  add constraint family_states_pkey primary key (user_id),
  add constraint family_states_family_email_normalized check (
    family_email = lower(trim(family_email))
    and length(family_email) > 3
  );

create index if not exists family_states_family_email_idx
on public.family_states (family_email);

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.family_profile_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  profile_id text not null,
  authorized_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  primary key (user_id, session_id)
);

alter table public.family_profile_sessions
  add column if not exists expires_at timestamptz not null default (now() + interval '15 minutes');

create table if not exists public.family_parent_auth_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  attempted_at timestamptz not null default now()
);

create index if not exists family_parent_auth_attempts_lookup_idx
on public.family_parent_auth_attempts (user_id, session_id, attempted_at);

alter table public.family_states enable row level security;
alter table public.family_profile_sessions enable row level security;
alter table public.family_parent_auth_attempts enable row level security;

grant select on public.family_states to authenticated;
revoke insert, update on public.family_states from authenticated;
revoke all on public.family_states from anon;
revoke all on public.family_profile_sessions from anon, authenticated;
revoke all on public.family_parent_auth_attempts from anon, authenticated;

drop policy if exists "anon can read family states" on public.family_states;
drop policy if exists "anon can insert family states" on public.family_states;
drop policy if exists "anon can update family states" on public.family_states;
drop policy if exists "authenticated can read family states" on public.family_states;
drop policy if exists "authenticated can insert family states" on public.family_states;
drop policy if exists "authenticated can update family states" on public.family_states;
drop policy if exists "users can read their family state" on public.family_states;
drop policy if exists "users can insert their family state" on public.family_states;
drop policy if exists "users can update their family state" on public.family_states;

create or replace function public.current_family_session_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'session_id', '')::uuid
$$;

create or replace function public.current_profile_can_manage()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.family_profile_sessions fps
    join public.family_states fs on fs.user_id = fps.user_id
    where fps.user_id = auth.uid()
      and fps.session_id = public.current_family_session_id()
      and fps.expires_at > now()
      and exists (
        select 1
        from jsonb_array_elements(
          coalesce(fs.state -> 'members', '[]'::jsonb)
          || coalesce(fs.state -> 'dashboardMembers', '[]'::jsonb)
        ) member
        where member ->> 'id' = fps.profile_id
        group by member ->> 'id'
        having count(distinct member ->> 'role') = 1
          and bool_and(jsonb_typeof(member -> 'role') = 'string')
          and min(member ->> 'role') = 'Parent'
      )
  )
$$;

create or replace function public.family_state_is_valid(candidate_state jsonb)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  if jsonb_typeof(candidate_state) <> 'object'
    or jsonb_typeof(candidate_state -> 'members') <> 'array'
    or jsonb_typeof(candidate_state -> 'dashboardMembers') <> 'array' then
    return false;
  end if;

  return coalesce((
    with profiles as (
      select
        member ->> 'id' as id,
        member ->> 'role' as role,
        jsonb_typeof(member -> 'id') as id_type,
        jsonb_typeof(member -> 'role') as role_type
      from jsonb_array_elements(
        candidate_state -> 'members' || candidate_state -> 'dashboardMembers'
      ) member
    )
    select
      exists (select 1 from profiles where role = 'Parent')
      and not exists (
        select 1 from profiles
        where id_type is distinct from 'string'
          or role_type is distinct from 'string'
          or coalesce(id, '') = ''
          or role not in ('Parent', 'Child')
      )
      and not exists (
        select 1
        from profiles
        group by id
        having count(distinct role) > 1
      )
  ), false);
end;
$$;

drop function if exists public.create_family_state(text, jsonb);

create or replace function public.create_family_state(
  requested_family_email text,
  requested_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  stored_state jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if lower(trim(requested_family_email)) <> requested_family_email
    or length(requested_family_email) <= 3
    or not public.family_state_is_valid(requested_state) then
    raise exception 'Invalid initial family state';
  end if;

  insert into public.family_states (user_id, family_email, state, updated_at)
  values (auth.uid(), requested_family_email, requested_state, now())
  on conflict (user_id) do nothing;

  select state into stored_state
  from public.family_states
  where user_id = auth.uid();

  return stored_state;
end;
$$;

drop function if exists public.select_family_profile(text);
drop function if exists public.select_family_profile(text, text);

create or replace function public.select_family_profile(
  requested_profile_id text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
begin
  if auth.uid() is null or public.current_family_session_id() is null then
    raise exception 'Authentication session is required';
  end if;

  select
    case
      when count(distinct member ->> 'role') = 1
        and bool_and(jsonb_typeof(member -> 'role') = 'string')
        and min(member ->> 'role') in ('Parent', 'Child')
      then lower(min(member ->> 'role'))
      else null
    end
    into requested_role
  from public.family_states fs
  cross join lateral jsonb_array_elements(
    coalesce(fs.state -> 'members', '[]'::jsonb)
    || coalesce(fs.state -> 'dashboardMembers', '[]'::jsonb)
  ) member
  where fs.user_id = auth.uid()
    and member ->> 'id' = requested_profile_id
  group by member ->> 'id';

  if requested_role is null then
    raise exception 'Profile does not belong to this family';
  end if;

  insert into public.family_profile_sessions (user_id, session_id, profile_id, authorized_at, expires_at)
  values (
    auth.uid(),
    public.current_family_session_id(),
    requested_profile_id,
    now(),
    'infinity'::timestamptz
  )
  on conflict (user_id, session_id)
  do update set
    profile_id = excluded.profile_id,
    authorized_at = excluded.authorized_at,
    expires_at = excluded.expires_at;

  return (
    select expires_at
    from public.family_profile_sessions
    where user_id = auth.uid()
      and session_id = public.current_family_session_id()
  );
end;
$$;

create or replace function public.save_family_state(
  requested_family_email text,
  requested_state jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.current_profile_can_manage() then
    raise exception 'A server-authorized Parent profile is required';
  end if;

  if not public.family_state_is_valid(requested_state) then
    raise exception 'Invalid family state';
  end if;

  update public.family_states
  set family_email = lower(trim(requested_family_email)),
      state = requested_state,
      updated_at = now()
  where user_id = auth.uid();

  if not found then
    raise exception 'Family state does not exist';
  end if;
end;
$$;

revoke all on function public.current_family_session_id() from public;
revoke all on function public.current_profile_can_manage() from public;
revoke all on function public.family_state_is_valid(jsonb) from public;
revoke all on function public.create_family_state(text, jsonb) from public;
revoke all on function public.select_family_profile(text) from public;
revoke all on function public.save_family_state(text, jsonb) from public;
grant execute on function public.create_family_state(text, jsonb) to authenticated;
grant execute on function public.select_family_profile(text) to authenticated;
grant execute on function public.save_family_state(text, jsonb) to authenticated;

create policy "users can read their family state"
on public.family_states
for select to authenticated
using ((select auth.uid()) = user_id);
