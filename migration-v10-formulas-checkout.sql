-- ============================================================
-- LUMA v10 – Client Formulas + Appointment Checkout
-- Run in Supabase SQL Editor
-- ============================================================

-- Client formulas table
CREATE TABLE IF NOT EXISTS client_formulas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_name    text NOT NULL DEFAULT '',   -- e.g. "Root Color", "Full Highlights"
  formula         text NOT NULL DEFAULT '',   -- e.g. "6N + 20g Olaplex, 1oz 20vol"
  developer       text DEFAULT '',            -- e.g. "20 vol", "30 vol"
  process_time    text DEFAULT '',            -- e.g. "45 min"
  notes           text DEFAULT '',
  applied_at      date DEFAULT CURRENT_DATE,
  -- Products used: [{product_id, product_name, amount, unit}]
  products_used   jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE client_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage client formulas"
  ON client_formulas FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS client_formulas_client_id_idx ON client_formulas(client_id);
CREATE INDEX IF NOT EXISTS client_formulas_owner_id_idx ON client_formulas(owner_id);

-- Add tube size fields to products table (for smart formula deduction)
-- tube_size: how many units (oz, g, ml, etc.) are in one container/tube
-- tube_size_unit: the unit of measurement
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tube_size      decimal(8,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tube_size_unit text         DEFAULT 'oz';
