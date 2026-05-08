-- LUMA Migration v4: Referral Campaigns + Referral Tracking
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Referral campaigns
create table if not exists referral_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active',          -- 'active' | 'paused' | 'ended'
  reward_description text default '$25 credit',  -- what the referrer gets
  new_client_offer text,                 -- optional reward for the new client
  ends_at date,
  created_at timestamptz default now()
);
alter table referral_campaigns enable row level security;
drop policy if exists "campaigns_owner" on referral_campaigns;
create policy "campaigns_owner" on referral_campaigns
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 2. Individual referral records
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  campaign_id uuid references referral_campaigns(id) on delete set null,
  referrer_client_id uuid references clients(id) on delete set null,
  referred_client_id uuid references clients(id) on delete set null,
  referred_name text,                    -- name when they haven't booked yet
  status text default 'pending',         -- 'pending' | 'converted' | 'rewarded'
  notes text,
  created_at timestamptz default now()
);
alter table referrals enable row level security;
drop policy if exists "referrals_owner" on referrals;
create policy "referrals_owner" on referrals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
