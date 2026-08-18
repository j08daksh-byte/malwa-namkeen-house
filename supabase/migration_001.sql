-- MishtiChaat — Migration 001
-- Safe, re-runnable migration. Uses IF NOT EXISTS and ON CONFLICT throughout.
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- DO NOT run schema.sql again after this migration is applied.

-- ─── locations ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
  id                text        PRIMARY KEY,
  name              text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  email             text,
  phone             text,
  whatsapp_number   text,
  address_line_1    text,
  address_line_2    text,
  city              text,
  state             text,
  postal_code       text,
  country           text        DEFAULT 'India',
  google_maps_url   text,
  gst_number        text,
  fssai_number      text,
  is_active         boolean     DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public users may read active locations (needed for multi-outlet future display)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Public read active locations'
  ) THEN
    CREATE POLICY "Public read active locations"
      ON locations FOR SELECT USING (is_active = true);
  END IF;
END $$;

INSERT INTO locations (
  id, name, slug, email, phone, whatsapp_number,
  address_line_1, address_line_2, city, state, postal_code, country,
  gst_number, fssai_number, is_active
) VALUES (
  'bengaluru-sarjapur',
  'MishtiChaat Cafe — Sarjapur Road',
  'bengaluru-sarjapur',
  'contact@mishtichaat.com',
  '+91 90350 56691',
  '919035056691',
  'No. 87/4-B, Sulikunte Village',
  'Sarjapur Main Road, Dommasandra Post',
  'Bengaluru',
  'Karnataka',
  '562125',
  'India',
  '29AQWPP5638F2ZO',
  '11225302002687',
  true
) ON CONFLICT (id) DO NOTHING;

-- ─── business_hours ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_hours (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  text        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  day_of_week  int         NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  opening_time time        NOT NULL,
  closing_time time        NOT NULL,
  is_closed    boolean     DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (location_id, day_of_week)
);

ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_hours' AND policyname = 'Public read business hours'
  ) THEN
    CREATE POLICY "Public read business hours"
      ON business_hours FOR SELECT USING (true);
  END IF;
END $$;

-- Seed hours for bengaluru-sarjapur
-- Mon=1,Tue=2,Wed=3,Thu=4 → 09:00–22:30
INSERT INTO business_hours (location_id, day_of_week, opening_time, closing_time) VALUES
  ('bengaluru-sarjapur', 1, '09:00', '22:30'),
  ('bengaluru-sarjapur', 2, '09:00', '22:30'),
  ('bengaluru-sarjapur', 3, '09:00', '22:30'),
  ('bengaluru-sarjapur', 4, '09:00', '22:30'),
  ('bengaluru-sarjapur', 5, '09:00', '23:00'), -- Friday
  ('bengaluru-sarjapur', 6, '08:30', '23:00'), -- Saturday
  ('bengaluru-sarjapur', 0, '08:30', '23:00')  -- Sunday
ON CONFLICT (location_id, day_of_week) DO NOTHING;

-- ─── Update contact_enquiries ──────────────────────────────────────────────────

-- Rename existing name column if it's already called 'name' (already correct in schema.sql)
-- Add missing columns safely
ALTER TABLE contact_enquiries
  ADD COLUMN IF NOT EXISTS customer_name  text,
  ADD COLUMN IF NOT EXISTS category       text DEFAULT 'general_enquiry',
  ADD COLUMN IF NOT EXISTS consent_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_id    text DEFAULT 'bengaluru-sarjapur',
  ADD COLUMN IF NOT EXISTS admin_notes    text,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

-- Backfill customer_name from name if null
UPDATE contact_enquiries
  SET customer_name = name
  WHERE customer_name IS NULL AND name IS NOT NULL;

-- ─── Update reservation_enquiries ─────────────────────────────────────────────

ALTER TABLE reservation_enquiries
  ADD COLUMN IF NOT EXISTS customer_name    text,
  ADD COLUMN IF NOT EXISTS email            text,
  ADD COLUMN IF NOT EXISTS reservation_date text,
  ADD COLUMN IF NOT EXISTS preferred_time   text,
  ADD COLUMN IF NOT EXISTS guest_count      int,
  ADD COLUMN IF NOT EXISTS special_request  text,
  ADD COLUMN IF NOT EXISTS consent_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_id      text DEFAULT 'bengaluru-sarjapur',
  ADD COLUMN IF NOT EXISTS admin_notes      text,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- Backfill customer_name from name
UPDATE reservation_enquiries
  SET customer_name = name
  WHERE customer_name IS NULL AND name IS NOT NULL;

-- ─── Update katering_enquiries ────────────────────────────────────────────────

ALTER TABLE katering_enquiries
  ADD COLUMN IF NOT EXISTS customer_name    text,
  ADD COLUMN IF NOT EXISTS email            text,
  ADD COLUMN IF NOT EXISTS consent_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_id      text DEFAULT 'bengaluru-sarjapur',
  ADD COLUMN IF NOT EXISTS admin_notes      text,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

UPDATE katering_enquiries
  SET customer_name = name
  WHERE customer_name IS NULL AND name IS NOT NULL;

-- ─── Update gifting_enquiries ─────────────────────────────────────────────────

ALTER TABLE gifting_enquiries
  ADD COLUMN IF NOT EXISTS customer_name    text,
  ADD COLUMN IF NOT EXISTS email            text,
  ADD COLUMN IF NOT EXISTS consent_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_id      text DEFAULT 'bengaluru-sarjapur',
  ADD COLUMN IF NOT EXISTS admin_notes      text,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

UPDATE gifting_enquiries
  SET customer_name = name
  WHERE customer_name IS NULL AND name IS NOT NULL;

-- ─── notification_log ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_log (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_type       text        NOT NULL, -- 'contact' | 'reservation' | 'katering' | 'gifting'
  enquiry_id         uuid        NOT NULL,
  notification_type  text        NOT NULL, -- 'customer_email' | 'admin_email' | 'whatsapp'
  recipient          text        NOT NULL, -- masked: first 3 chars + ***
  provider           text        NOT NULL, -- 'resend' | 'whatsapp_api' | 'click_to_chat'
  status             text        NOT NULL, -- 'sent' | 'failed' | 'not_configured' | 'skipped'
  provider_reference text,                 -- Resend message ID or similar
  error_message      text,                 -- first 500 chars of error only
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
-- No public access — admin-only via service role key

-- ─── RLS policies for enquiry tables ─────────────────────────────────────────
-- Public users: INSERT only (via Express backend with service role → bypasses RLS anyway,
-- but explicit policies make intent clear).
-- No public SELECT, UPDATE, or DELETE on enquiry tables.

-- contact_enquiries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'contact_enquiries' AND policyname = 'Service role full access'
  ) THEN
    -- All access goes through Express service role — no anon policies needed.
    -- This comment documents that intent explicitly.
    NULL;
  END IF;
END $$;

-- The service role key bypasses RLS entirely — no policy needed for backend.
-- Anon key has ZERO access to enquiry tables — correct and intentional.
-- Future admin dashboard will authenticate via Supabase Auth and use the service role on the server.
