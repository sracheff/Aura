-- LUMA Migration v2: Multi-service appointments + Public booking
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Add category to services
alter table services add column if not exists category text default 'Other';

-- 2. Update categories for existing seeded services
update services set category = 'Haircuts'   where name ilike '%haircut%' or name ilike '%cut%' or name ilike '%trim%' or name ilike '%bang%';
update services set category = 'Color'      where name ilike '%color%' or name ilike '%highlight%' or name ilike '%balayage%' or name ilike '%grey%' or name ilike '%gray%' or name ilike '%gloss%' or name ilike '%toner%' or name ilike '%root%' or name ilike '%lived%' or name ilike '%dimensional%' or name ilike '%correction%' or name ilike '%shadow%';
update services set category = 'Treatments' where name ilike '%treatment%' or name ilike '%olaplex%' or name ilike '%keratin%' or name ilike '%condition%' or name ilike '%bond%' or name ilike '%scalp%';
update services set category = 'Styling'    where name ilike '%blowout%' or name ilike '%style%' or name ilike '%styling%' or name ilike '%updo%' or name ilike '%bridal%' or name ilike '%event%';
update services set category = 'Extensions' where name ilike '%extension%';

-- 3. Appointment services junction table (multi-service per appointment)
create table if not exists appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  price numeric not null,
  duration integer not null
);
alter table appointment_services enable row level security;

-- 4. RLS for appointment_services
drop policy if exists "appt_services_owner" on appointment_services;
drop policy if exists "appt_services_public_insert" on appointment_services;
drop policy if exists "appt_services_public_read" on appointment_services;

create policy "appt_services_owner" on appointment_services
  for all using (
    appointment_id in (select id from appointments where owner_id = auth.uid())
  );
create policy "appt_services_public_insert" on appointment_services
  for insert with check (true);
create policy "appt_services_public_read" on appointment_services
  for select using (true);

-- 5. Public booking policies (allow clients to book without logging in)
drop policy if exists "services_public_read"      on services;
drop policy if exists "staff_public_read"          on staff;
drop policy if exists "appointments_public_read"   on appointments;
drop policy if exists "appointments_public_insert" on appointments;
drop policy if exists "clients_public_insert"      on clients;
drop policy if exists "clients_public_email_read"  on clients;

create policy "services_public_read"
  on services for select using (active = true);

create policy "staff_public_read"
  on staff for select using (active = true);

create policy "appointments_public_read"
  on appointments for select using (true);

create policy "appointments_public_insert"
  on appointments for insert with check (true);

create policy "clients_public_insert"
  on clients for insert with check (true);

create policy "clients_public_email_read"
  on clients for select using (true);

-- 6. Cancellation policy stored on the user profile (via auth metadata)
-- No table needed — stored in Supabase Auth user_metadata via Settings page.
