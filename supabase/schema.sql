-- ==============================================================================
-- Decyde Supabase Database Schema
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- Safe to re-run: policies/triggers are dropped and recreated each time.
-- ==============================================================================

-- 1. Create 'rooms' table
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (char_length(code) between 4 and 8),
  question text not null check (char_length(question) between 1 and 300),
  created_at timestamptz not null default now(),
  duration_seconds integer not null default 300 check (duration_seconds between 15 and 1800),
  status text not null default 'open' check (status in ('open', 'closed'))
);

-- 2. Create 'options' table
create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 120),
  emoji text not null default '✨' check (char_length(emoji) between 1 and 8)
);

-- 3. Create 'votes' table
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  option_id uuid not null references public.options(id) on delete cascade,
  voter_id text not null check (char_length(voter_id) between 1 and 64),
  vote_type text not null check (vote_type in ('yes', 'no', 'meh')),
  created_at timestamptz not null default now(),
  -- Prevent duplicate votes from the same voter on the same option
  unique (room_id, option_id, voter_id)
);

-- 4. Create Indexes for query performance
create index if not exists idx_rooms_code on public.rooms(code);
create index if not exists idx_options_room_id on public.options(room_id);
create index if not exists idx_votes_room_id on public.votes(room_id);
create index if not exists idx_votes_option_id on public.votes(option_id);
create index if not exists idx_votes_voter_id on public.votes(voter_id);

-- 5. Enable Row Level Security (RLS)
alter table public.rooms enable row level security;
alter table public.options enable row level security;
alter table public.votes enable row level security;

-- RLS policies only govern which ROWS a role can see/touch — the role still
-- needs a base table-level grant to access the table at all. Supabase's
-- dashboard Table Editor adds these automatically; running this schema
-- through the SQL Editor does not, so it's done explicitly here.
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.rooms to anon, authenticated;
grant select, insert on public.options to anon, authenticated;
grant select, insert on public.votes to anon, authenticated;

-- ==============================================================================
-- 6. RLS Policies
--
-- There's no login in this app (voter identity is a client-generated id in
-- localStorage), so RLS can't scope writes to "rows you own" the normal way.
-- Instead, the model is: anyone can read and create, but once a row exists
-- its integrity-sensitive fields are locked down —
--   - votes are insert-only. Nothing in the app ever edits a cast vote, so
--     there is no update/delete policy for votes at all: once cast, a vote
--     cannot be altered or removed by anyone through the anon key.
--   - a room's `question`/`code`/`duration_seconds` are immutable after
--     creation (enforced by a trigger below, not just a policy, so it holds
--     regardless of what the client sends). Only `status`/`created_at` may
--     change, which is what closing a room (or re-opening the demo room)
--     needs and nothing more.
--   - options have no update/delete policy — they're set once at room
--     creation and never edited by the app.
-- ==============================================================================

-- Rooms Policies
drop policy if exists "Allow public read access on rooms" on public.rooms;
create policy "Allow public read access on rooms"
  on public.rooms for select
  using (true);

drop policy if exists "Allow public insert on rooms" on public.rooms;
create policy "Allow public insert on rooms"
  on public.rooms for insert
  with check (status = 'open');

drop policy if exists "Allow public update on rooms" on public.rooms;
create policy "Allow status-only update on rooms"
  on public.rooms for update
  using (true)
  with check (status in ('open', 'closed'));

-- Belt-and-suspenders on top of the policy above: even a caller that
-- satisfies the update policy cannot smuggle a change to code/question/
-- duration_seconds through, because this runs for every update regardless
-- of RLS.
create or replace function public.rooms_restrict_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.code is distinct from old.code
     or new.question is distinct from old.question
     or new.duration_seconds is distinct from old.duration_seconds then
    raise exception 'Only status may be changed on an existing room';
  end if;
  return new;
end;
$$;

drop trigger if exists rooms_restrict_update_trigger on public.rooms;
create trigger rooms_restrict_update_trigger
  before update on public.rooms
  for each row execute function public.rooms_restrict_update();

-- Options Policies (read + create only — never edited after a room is made)
drop policy if exists "Allow public read access on options" on public.options;
create policy "Allow public read access on options"
  on public.options for select
  using (true);

drop policy if exists "Allow public insert on options" on public.options;
create policy "Allow public insert on options"
  on public.options for insert
  with check (true);

-- Votes Policies (read + create only — a cast vote can never be edited or
-- removed through the anon key; see note above)
drop policy if exists "Allow public read access on votes" on public.votes;
create policy "Allow public read access on votes"
  on public.votes for select
  using (true);

drop policy if exists "Allow public insert on votes" on public.votes;
create policy "Allow public insert on votes"
  on public.votes for insert
  with check (true);

drop policy if exists "Allow public update on votes" on public.votes;

-- 7. Enable Realtime subscriptions for live room updates and voting
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.options;
alter publication supabase_realtime add table public.votes;

-- ==============================================================================
-- Streaks: device-bound profile (no login) keyed by the anonymous voter_id
-- already stored in localStorage. Tracks a daily voting streak.
-- ==============================================================================

-- 8. Create 'profiles' table
create table if not exists public.profiles (
  voter_id text primary key check (char_length(voter_id) between 1 and 64),
  display_name text check (display_name is null or char_length(display_name) <= 60),
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  total_rooms integer not null default 0 check (total_rooms >= 0),
  updated_at timestamptz not null default now(),
  check (longest_streak >= current_streak)
);

-- 9. Enable RLS and allow public/anonymous access, consistent with the tables above
alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to anon, authenticated;

drop policy if exists "Allow public read access on profiles" on public.profiles;
create policy "Allow public read access on profiles"
  on public.profiles for select
  using (true);

drop policy if exists "Allow public insert on profiles" on public.profiles;
create policy "Allow public insert on profiles"
  on public.profiles for insert
  with check (true);

drop policy if exists "Allow public update on profiles" on public.profiles;
create policy "Allow public update on profiles"
  on public.profiles for update
  using (true)
  with check (true);
