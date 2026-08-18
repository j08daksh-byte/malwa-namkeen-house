-- MishtiChaat — Migration 002: Admin Infrastructure
-- Safe, re-runnable. Run in Supabase SQL Editor after migration_001.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── admin_profiles ──────────────────────────────────────────────────────────
-- One row per admin user. Must match a row in auth.users.
-- No row here (or is_active = false) → access denied even with valid Supabase session.

CREATE TABLE IF NOT EXISTS admin_profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  role        text        NOT NULL DEFAULT 'staff'
                          CHECK (role IN ('super_admin', 'admin', 'staff')),
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can only read their own profile (the server reads via service role)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'Admin read own profile'
  ) THEN
    CREATE POLICY "Admin read own profile"
      ON admin_profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- ─── business_settings ───────────────────────────────────────────────────────
-- Key-value store for admin-editable business config per location.
-- API keys and service credentials must NEVER be stored here.

CREATE TABLE IF NOT EXISTS business_settings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text        NOT NULL DEFAULT 'bengaluru-sarjapur',
  key         text        NOT NULL,
  value       text,
  label       text        NOT NULL,          -- human-readable label for the UI
  description text,                          -- helper text shown in settings UI
  is_public   boolean     NOT NULL DEFAULT false,  -- true = safe to expose to frontend
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid        REFERENCES auth.users(id),
  UNIQUE (location_id, key)
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Public can read public settings (e.g. google_maps_url, menu_pdf_url)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_settings' AND policyname = 'Public read public settings'
  ) THEN
    CREATE POLICY "Public read public settings"
      ON business_settings FOR SELECT
      USING (is_public = true);
  END IF;
END $$;

-- Seed default settings
INSERT INTO business_settings (location_id, key, value, label, description, is_public) VALUES
  ('bengaluru-sarjapur', 'business_name',         'MishtiChaat',                               'Business Name',           'Display name of the business',                               true),
  ('bengaluru-sarjapur', 'business_email',         'contact@mishtichaat.com',                   'Business Email',          'Primary contact email shown on website',                      true),
  ('bengaluru-sarjapur', 'business_phone',         '+91 90350 56691',                           'Phone Number',            'Display phone number',                                        true),
  ('bengaluru-sarjapur', 'whatsapp_number',        '919035056691',                              'WhatsApp Number',         'International format without + for wa.me links',              false),
  ('bengaluru-sarjapur', 'address_line_1',         'No. 87/4-B, Sulikunte Village',             'Address Line 1',          NULL,                                                          true),
  ('bengaluru-sarjapur', 'address_line_2',         'Sarjapur Main Road, Dommasandra Post',      'Address Line 2',          NULL,                                                          true),
  ('bengaluru-sarjapur', 'city',                   'Bengaluru',                                 'City',                    NULL,                                                          true),
  ('bengaluru-sarjapur', 'state',                  'Karnataka',                                 'State',                   NULL,                                                          true),
  ('bengaluru-sarjapur', 'postal_code',            '562125',                                    'Postal Code',             NULL,                                                          true),
  ('bengaluru-sarjapur', 'gst_number',             '29AQWPP5638F2ZO',                           'GST Number',              'GSTIN for display on receipts',                               true),
  ('bengaluru-sarjapur', 'fssai_number',           '11225302002687',                            'FSSAI Number',            'Food safety licence number',                                  true),
  ('bengaluru-sarjapur', 'google_maps_url',        '',                                          'Google Maps URL',         'Full Google Maps embed or share URL. Leave blank until provided by client.', true),
  ('bengaluru-sarjapur', 'admin_notification_email','contact@mishtichaat.com',                  'Admin Notification Email','Email address for new enquiry alerts',                        false),
  ('bengaluru-sarjapur', 'menu_pdf_url',           '',                                          'Menu PDF URL',            'Direct URL to the uploaded menu PDF. Leave blank until PDF is supplied.', true)
ON CONFLICT (location_id, key) DO NOTHING;

-- ─── reservation_enquiries — status values ────────────────────────────────────
-- Add a check constraint for allowed statuses (idempotent workaround)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservation_enquiries_status_check'
  ) THEN
    ALTER TABLE reservation_enquiries
      ADD CONSTRAINT reservation_enquiries_status_check
      CHECK (status IN ('new','contacted','confirmed','declined','cancelled','completed','no_show'));
  END IF;
EXCEPTION WHEN others THEN
  -- Status column may have existing rows that violate; skip constraint if so
  NULL;
END $$;

-- ─── contact_enquiries — status values ───────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contact_enquiries_status_check'
  ) THEN
    ALTER TABLE contact_enquiries
      ADD CONSTRAINT contact_enquiries_status_check
      CHECK (status IN ('new','in_progress','resolved','closed','spam'));
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ─── notification_log — indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_status     ON contact_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_created    ON contact_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_category   ON contact_enquiries(category);
CREATE INDEX IF NOT EXISTS idx_reservation_enquiries_status  ON reservation_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_reservation_enquiries_created ON reservation_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservation_enquiries_date    ON reservation_enquiries(reservation_date);
