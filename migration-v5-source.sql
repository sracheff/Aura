-- LUMA Migration v5: Booking Source Tracking
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run

alter table appointments add column if not exists source text;
alter table clients      add column if not exists source text;
