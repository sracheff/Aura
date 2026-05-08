-- ============================================================
-- LUMA migration v8 — booking, expenses, waitlist, availability
-- Safe to run in one shot; all statements use IF NOT EXISTS
-- ============================================================

-- ── 1. Expenses ───────────────────────────────────────────────
create table if not exists expenses (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references auth.users(id) on delete cascade,
  category   text not null default 'other', -- rent | supplies | utilities | equipment | marketing | payroll | other
  amount     numeric not null,
  expense_date date not null default current_date,
  vendor     text,
  notes      text,
  created_at timestamptz default now()
);
alter table expenses enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='expenses' and policyname='owner access') then
    execute 'create policy "owner access" on expenses using (owner_id = auth.uid())';
  end if;
end $$;

-- ── 2. Waitlist ───────────────────────────────────────────────
create table if not exists waitlist (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references auth.users(id) on delete cascade,
  client_name      text not null,
  client_phone     text,
  client_email     text,
  client_id        uuid references clients(id) on delete set null,
  service_id       uuid references services(id) on delete set null,
  service_name     text,
  preferred_staff_id uuid references staff(id) on delete set null,
  preferred_date   date,
  notes            text,
  status           text not null default 'waiting', -- waiting | notified | booked | cancelled
  notified_at      timestamptz,
  created_at       timestamptz default now()
);
alter table waitlist enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='waitlist' and policyname='owner access') then
    execute 'create policy "owner access" on waitlist using (owner_id = auth.uid())';
  end if;
end $$;

-- ── 3. Staff availability ────────────────────────────────────
create table if not exists staff_availability (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade,
  staff_id    uuid references staff(id) on delete cascade,
  day_of_week integer not null,  -- 0=Sun, 1=Mon, ... 6=Sat
  open_time   time not null default '09:00',
  close_time  time not null default '18:00',
  constraint uq_staff_day unique (staff_id, day_of_week)
);
alter table staff_availability enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='staff_availability' and policyname='owner access') then
    execute 'create policy "owner access" on staff_availability using (owner_id = auth.uid())';
  end if;
end $$;

-- Public read for booking page (clients need to see availability)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='staff_availability' and policyname='public read availability') then
    execute 'create policy "public read availability" on staff_availability for select using (true)';
  end if;
end $$;

-- ── 4. Appointment enhancements ──────────────────────────────
alter table appointments add column if not exists reminder_sent_at timestamptz;
alter table appointments add column if not exists review_sent_at   timestamptz;
alter table appointments add column if not exists visit_notes      text;  -- post-visit consultation notes

-- ── 5. Review log ─────────────────────────────────────────────
create table if not exists review_requests (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid references auth.users(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  client_id      uuid references clients(id) on delete set null,
  phone          text,
  status         text default 'sent',
  sent_at        timestamptz default now()
);
alter table review_requests enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='review_requests' and policyname='owner access') then
    execute 'create policy "owner access" on review_requests using (owner_id = auth.uid())';
  end if;
end $$;

-- ── 6. Public read policies for booking page ─────────────────
-- Services: public read so booking page can list them
do $$ begin
  if not exists (select 1 from pg_policies where tablename='services' and policyname='public read services') then
    execute 'create policy "public read services" on services for select using (true)';
  end if;
end $$;

-- Staff: public read so booking page can show stylists
do $$ begin
  if not exists (select 1 from pg_policies where tablename='staff' and policyname='public read staff') then
    execute 'create policy "public read staff" on staff for select using (true)';
  end if;
end $$;

-- Appointments: public read (limited fields) so booking page can check availability
do $$ begin
  if not exists (select 1 from pg_policies where tablename='appointments' and policyname='public read appointments') then
    execute 'create policy "public read appointments" on appointments for select using (true)';
  end if;
end $$;

-- Appointments: public insert for online booking
do $$ begin
  if not exists (select 1 from pg_policies where tablename='appointments' and policyname='public insert appointments') then
    execute 'create policy "public insert appointments" on appointments for insert with check (true)';
  end if;
end $$;

-- Waitlist: public insert for waitlist signups
do $$ begin
  if not exists (select 1 from pg_policies where tablename='waitlist' and policyname='public insert waitlist') then
    execute 'create policy "public insert waitlist" on waitlist for insert with check (true)';
  end if;
end $$;

-- ── 7. Fix v7 inventory reference (products is the real table) ─
alter table products add column if not exists low_stock_threshold integer default 0;
