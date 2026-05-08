-- LUMA Migration v3: Staff Schedules + Time Blocking
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Weekly schedule template per staff member
create table if not exists staff_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  staff_id uuid references staff(id) on delete cascade,
  day_of_week integer not null, -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  is_working boolean default true,
  start_time text not null default '09:00',
  end_time text not null default '17:00',
  unique(staff_id, day_of_week)
);
alter table staff_schedules enable row level security;
drop policy if exists "schedules_owner" on staff_schedules;
drop policy if exists "schedules_public_read" on staff_schedules;
create policy "schedules_owner" on staff_schedules for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "schedules_public_read" on staff_schedules for select using (true);

-- 2. Time blocks — specific date overrides (blocks, vacations, special openings)
create table if not exists time_blocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  staff_id uuid references staff(id) on delete cascade,
  date date not null,
  start_time text,       -- null = full day
  end_time text,         -- null = full day
  reason text,
  type text default 'block',  -- 'block' | 'day_off' | 'vacation' | 'exception_open'
  created_at timestamptz default now()
);
alter table time_blocks enable row level security;
drop policy if exists "blocks_owner" on time_blocks;
drop policy if exists "blocks_public_read" on time_blocks;
create policy "blocks_owner" on time_blocks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "blocks_public_read" on time_blocks for select using (true);
