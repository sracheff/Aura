-- ============================================================
-- LUMA migration v7 — all new features
-- Safe to run in one shot; all statements use IF NOT EXISTS
-- ============================================================

-- ── 1. Gift Cards ────────────────────────────────────────────
create table if not exists gift_cards (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade,
  code          text not null,
  initial_value numeric not null default 0,
  balance       numeric not null default 0,
  issued_to     text,                         -- client name (free text)
  client_id     uuid references clients(id) on delete set null,
  purchased_by  text,                         -- who bought it
  status        text not null default 'active', -- active | redeemed | expired | voided
  expires_at    date,
  notes         text,
  created_at    timestamptz default now()
);
alter table gift_cards enable row level security;
create policy "owner access" on gift_cards using (owner_id = auth.uid());

create table if not exists gift_card_transactions (
  id           uuid primary key default gen_random_uuid(),
  gift_card_id uuid references gift_cards(id) on delete cascade,
  owner_id     uuid references auth.users(id) on delete cascade,
  amount       numeric not null,              -- negative = redemption, positive = reload
  transaction_id uuid references transactions(id) on delete set null,
  note         text,
  created_at   timestamptz default now()
);
alter table gift_card_transactions enable row level security;
create policy "owner access" on gift_card_transactions using (owner_id = auth.uid());

-- ── 2. Staff commissions ─────────────────────────────────────
alter table staff add column if not exists commission_pct numeric default 0;
alter table staff add column if not exists commission_type text default 'pct'; -- pct | flat

-- ── 3. POS: split payments & refunds ─────────────────────────
alter table transactions add column if not exists payment_method_2 text;
alter table transactions add column if not exists amount_2         numeric default 0;
alter table transactions add column if not exists gift_card_id     uuid references gift_cards(id) on delete set null;
alter table transactions add column if not exists gift_card_amount numeric default 0;
alter table transactions add column if not exists refunded_at      timestamptz;
alter table transactions add column if not exists refund_amount    numeric default 0;
alter table transactions add column if not exists refund_note      text;

-- ── 4. Recurring appointments ────────────────────────────────
alter table appointments add column if not exists recurring_rule   text;   -- none | weekly | biweekly | monthly
alter table appointments add column if not exists recurring_parent uuid references appointments(id) on delete set null;
alter table appointments add column if not exists buffer_minutes   integer default 0;

-- ── 5. No-show / cancellation tracking ───────────────────────
-- status already exists on appointments; we just document the new values:
-- 'no_show' | 'cancelled' are now valid statuses alongside existing ones
alter table appointments add column if not exists cancellation_fee numeric default 0;
alter table appointments add column if not exists cancellation_note text;

-- ── 6. Inventory low-stock threshold ─────────────────────────
alter table inventory add column if not exists low_stock_threshold integer default 0;

-- ── 7. Client birthday ───────────────────────────────────────
alter table clients add column if not exists birthday date;

-- ── 8. Consultation / intake forms ───────────────────────────
create table if not exists intake_forms (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references auth.users(id) on delete cascade,
  name       text not null,
  description text,
  fields     jsonb not null default '[]', -- array of { id, label, type, options, required }
  active     boolean default true,
  created_at timestamptz default now()
);
alter table intake_forms enable row level security;
create policy "owner access" on intake_forms using (owner_id = auth.uid());

create table if not exists intake_responses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references auth.users(id) on delete cascade,
  form_id     uuid references intake_forms(id) on delete cascade,
  client_id   uuid references clients(id) on delete set null,
  appointment_id uuid references appointments(id) on delete set null,
  answers     jsonb not null default '{}', -- { field_id: value }
  submitted_at timestamptz default now()
);
alter table intake_responses enable row level security;
create policy "owner access" on intake_responses using (owner_id = auth.uid());

-- Public insert for form submissions (clients submitting forms)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'intake_responses' and policyname = 'public insert intake responses'
  ) then
    execute 'create policy "public insert intake responses" on intake_responses for insert with check (true)';
  end if;
end $$;

-- ── 9. Appointment reminders log ─────────────────────────────
create table if not exists reminder_logs (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid references auth.users(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade,
  client_id      uuid references clients(id) on delete set null,
  channel        text not null default 'sms',  -- sms | email
  phone          text,
  message        text,
  status         text default 'sent',           -- sent | failed
  sent_at        timestamptz default now()
);
alter table reminder_logs enable row level security;
create policy "owner access" on reminder_logs using (owner_id = auth.uid());

