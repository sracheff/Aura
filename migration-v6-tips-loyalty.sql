-- LUMA Migration v6: Tips + Loyalty Rules
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Tip amount on appointments (client books with intended tip)
alter table appointments  add column if not exists tip_amount numeric default 0;

-- 2. Tip amount on transactions (collected at POS)
alter table transactions   add column if not exists tip_amount numeric default 0;

-- 3. Loyalty rules — bonus points for services/days/products
create table if not exists loyalty_rules (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  trigger_type    text not null default 'any',   -- 'service' | 'day_of_week' | 'any'
  service_id      uuid references services(id) on delete set null,
  day_of_week     integer,                        -- 0=Sun…6=Sat, null=every day
  points_multiplier numeric default 2,            -- e.g. 2 = double points
  bonus_points    integer default 0,              -- flat bonus on top
  active          boolean default true,
  created_at      timestamptz default now()
);
alter table loyalty_rules enable row level security;
drop policy if exists "loyalty_rules_owner" on loyalty_rules;
create policy "loyalty_rules_owner" on loyalty_rules
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
