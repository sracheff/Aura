-- ============================================================
-- LUMA v9 – Monetization: Salons + Subscriptions
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. SALONS TABLE (one per owner)
CREATE TABLE IF NOT EXISTS salons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL DEFAULT '',
  slug            text UNIQUE,
  address         text DEFAULT '',
  phone           text DEFAULT '',
  timezone        text DEFAULT 'America/New_York',
  logo_url        text DEFAULT '',
  google_review_url text DEFAULT '',

  -- Subscription fields
  plan            text NOT NULL DEFAULT 'trial',   -- trial | starter | pro | cancelled
  trial_ends_at   timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  stripe_customer_id      text,
  stripe_subscription_id  text,
  stripe_price_id         text,
  subscription_status     text DEFAULT 'trialing', -- trialing | active | past_due | cancelled
  current_period_end      timestamptz,

  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own salon"
  ON salons FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- 2. ONBOARDING STEP TRACKING
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step     int     DEFAULT 0;

-- 3. FUNCTION: auto-create salon on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.salons (owner_id, name, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'salon_name', ''),
    now() + interval '14 days'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SUBSCRIPTION EVENTS LOG
CREATE TABLE IF NOT EXISTS subscription_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  salon_id      uuid REFERENCES salons(id) ON DELETE SET NULL,
  event_type    text NOT NULL,  -- checkout.completed | subscription.updated | subscription.deleted
  stripe_event_id text,
  payload       jsonb,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners view own events"
  ON subscription_events FOR SELECT
  USING (owner_id = auth.uid());

-- Service role can insert (used by webhook)
CREATE POLICY "service role insert events"
  ON subscription_events FOR INSERT
  WITH CHECK (true);

-- 5. INDEX
CREATE INDEX IF NOT EXISTS salons_owner_id_idx ON salons(owner_id);
CREATE INDEX IF NOT EXISTS salons_stripe_customer_idx ON salons(stripe_customer_id);
