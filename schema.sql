-- LUMA Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Staff / Stylists
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  color text default '#C9A96E',
  bg_color text default '#FBF5E8',
  commission_rate integer default 40,
  active boolean default true,
  tips numeric default 0,
  rating numeric default 5.0,
  created_at timestamptz default now()
);

-- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tier text default 'Bronze',
  points integer default 0,
  total_spend numeric default 0,
  visits integer default 0,
  last_visit date,
  referrals integer default 0,
  notes text,
  created_at timestamptz default now()
);

-- Services
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  price numeric not null,
  duration integer not null,
  commission_rate integer default 40,
  active boolean default true,
  created_at timestamptz default now()
);

-- Appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  service_name text not null,
  start_time timestamptz not null,
  duration integer not null,
  price numeric not null,
  status text default 'confirmed',
  notes text,
  loyalty_points integer default 0,
  created_at timestamptz default now()
);

-- Products / Inventory
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  type text default 'retail',
  qty integer default 0,
  reorder_at integer default 5,
  cost numeric default 0,
  price numeric default 0,
  margin integer default 0,
  created_at timestamptz default now()
);

-- POS Transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  subtotal numeric not null,
  discount_pct integer default 0,
  discount_amt numeric default 0,
  tax numeric default 0,
  total numeric not null,
  payment_method text default 'card',
  created_at timestamptz default now()
);

-- Transaction Line Items
create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  name text not null,
  price numeric not null,
  qty integer default 1,
  type text default 'service'
);

-- Expenses
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  category text not null,
  vendor text,
  amount numeric not null,
  type text default 'fixed',
  date date default current_date,
  created_at timestamptz default now()
);

-- Enable Row Level Security (users only see their own data)
alter table staff enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table products enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;
alter table expenses enable row level security;

-- RLS Policies
create policy "staff_owner" on staff for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "clients_owner" on clients for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "services_owner" on services for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "appointments_owner" on appointments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "products_owner" on products for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "transactions_owner" on transactions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "transaction_items_policy" on transaction_items for all using (
  transaction_id in (select id from transactions where owner_id = auth.uid())
);
create policy "expenses_owner" on expenses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
