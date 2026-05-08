-- LUMA: Seed Services for Stewart Hair
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- Automatically attaches to your account.

DO $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Grab your user ID automatically
  SELECT id INTO v_owner_id FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Make sure you have signed up on LUMA first.';
  END IF;

  INSERT INTO services (owner_id, name, price, duration, commission_rate, active) VALUES

  -- ─── HAIRCUTS ────────────────────────────────────────────────────
  (v_owner_id, 'Women''s Haircut & Blowout',          85,   60,  40, true),
  (v_owner_id, 'Women''s Dry Cut / Trim',             65,   45,  40, true),
  (v_owner_id, 'Men''s Haircut',                      45,   30,  40, true),
  (v_owner_id, 'Kids Haircut (12 & under)',            35,   30,  40, true),
  (v_owner_id, 'Bang Trim',                           15,   15,  40, true),
  (v_owner_id, 'Haircut + Blowout + Style',           105,  75,  40, true),

  -- ─── COLOR ───────────────────────────────────────────────────────
  (v_owner_id, 'Root Touch-Up',                       85,   60,  40, true),
  (v_owner_id, 'Single Process Color',                95,   75,  40, true),
  (v_owner_id, 'Grey Blending',                       105,  75,  40, true),
  (v_owner_id, 'Full Grey Coverage',                  115,  90,  40, true),
  (v_owner_id, 'Gloss / Toner',                       55,   30,  40, true),
  (v_owner_id, 'Root Shadow / Smudge',                65,   45,  40, true),
  (v_owner_id, 'Partial Highlights (Foil)',           125,  90,  40, true),
  (v_owner_id, 'Full Highlights (Foil)',              160,  120, 40, true),
  (v_owner_id, 'Balayage',                            185,  180, 40, true),
  (v_owner_id, 'Full Balayage',                       235,  210, 40, true),
  (v_owner_id, 'Lived-In Color',                      195,  180, 40, true),
  (v_owner_id, 'Dimensional Color',                   215,  210, 40, true),
  (v_owner_id, 'Color Correction (consult required)', 275,  240, 40, true),
  (v_owner_id, 'Color + Haircut',                     155,  120, 40, true),
  (v_owner_id, 'Balayage + Haircut',                  245,  210, 40, true),

  -- ─── TREATMENTS ──────────────────────────────────────────────────
  (v_owner_id, 'Olaplex Treatment (add-on)',           45,   15,  40, true),
  (v_owner_id, 'Deep Conditioning Treatment',          45,   30,  40, true),
  (v_owner_id, 'Bond Repair Treatment',                55,   30,  40, true),
  (v_owner_id, 'Scalp Treatment',                     55,   30,  40, true),
  (v_owner_id, 'Keratin Smoothing Treatment',          275,  180, 40, true),
  (v_owner_id, 'Express Keratin',                     175,  90,  40, true),

  -- ─── STYLING ─────────────────────────────────────────────────────
  (v_owner_id, 'Blowout',                             55,   45,  40, true),
  (v_owner_id, 'Blowout + Curl / Style',              75,   60,  40, true),
  (v_owner_id, 'Special Occasion Updo',               125,  60,  40, true),
  (v_owner_id, 'Bridal Updo',                         185,  90,  40, true),
  (v_owner_id, 'Bridal Trial',                        155,  90,  40, true),
  (v_owner_id, 'Event Styling',                       95,   60,  40, true),

  -- ─── EXTENSIONS ──────────────────────────────────────────────────
  (v_owner_id, 'Extensions Consultation',              0,    30,  40, true),
  (v_owner_id, 'Hand-Tied Extensions Install (1 row)', 350,  180, 40, true),
  (v_owner_id, 'Hand-Tied Extensions Install (2 rows)',650,  240, 40, true),
  (v_owner_id, 'Hand-Tied Extensions Install (3 rows)',925,  300, 40, true),
  (v_owner_id, 'Extension Move-Up / Maintenance',      265,  120, 40, true),
  (v_owner_id, 'Extension Removal',                   115,  60,  40, true),
  (v_owner_id, 'Extension Removal + Reinstall',        375,  210, 40, true)

  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Success! % services added to your account.',
    (SELECT COUNT(*) FROM services WHERE owner_id = v_owner_id);
END $$;
