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

alter table public.family_states enable row level security;

grant select, insert, update on public.family_states to authenticated;
revoke all on public.family_states from anon;

drop policy if exists "anon can read family states" on public.family_states;
drop policy if exists "anon can insert family states" on public.family_states;
drop policy if exists "anon can update family states" on public.family_states;
drop policy if exists "authenticated can read family states" on public.family_states;
drop policy if exists "authenticated can insert family states" on public.family_states;
drop policy if exists "authenticated can update family states" on public.family_states;
drop policy if exists "users can read their family state" on public.family_states;
drop policy if exists "users can insert their family state" on public.family_states;
drop policy if exists "users can update their family state" on public.family_states;

create policy "users can read their family state"
on public.family_states
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert their family state"
on public.family_states
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update their family state"
on public.family_states
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
