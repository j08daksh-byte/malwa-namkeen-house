-- MishtiChaat — Migration 000: Initial Schema
-- Creates the four base enquiry tables required before migration_001.sql is run.
--
-- Run order for a fresh Supabase project:
--   1. migration_000_initial_schema.sql  ← this file
--   2. migration_001.sql                 ← adds locations, hours, extends tables
--   3. migration_002.sql                 ← adds admin_profiles, business_settings
--
-- Safe, re-runnable (all statements use CREATE TABLE IF NOT EXISTS).
-- Do NOT run this against an existing database that already has these tables —
-- migration_001.sql is designed to ALTER existing tables in place.
--
-- Column set is derived from:
--   • The ALTER TABLE … ADD COLUMN IF NOT EXISTS statements in migration_001.sql
--     (i.e. these are the columns that existed BEFORE migration_001 ran)
--   • The insert row objects in server/routes/enquiries.ts and server/lib/enquiries.ts
--   • The Zod schemas in server/validate.ts
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── contact_enquiries ────────────────────────────────────────────────────────
-- Stores general, catering, bulk-order, corporate gifting, and birthday enquiries
-- submitted through the Contact form on the public website.

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  phone      text,
  email      text,
  -- 'occasion' was used as a human-readable category label in the original schema
  occasion   text,
  message    text        NOT NULL,
  source     text        DEFAULT 'website',
  status     text        NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_enquiries ENABLE ROW LEVEL SECURITY;
-- All access goes through the Express backend using the service role key,
-- which bypasses RLS. No anon INSERT policy is needed or desired.

-- ─── reservation_enquiries ────────────────────────────────────────────────────
-- Stores table reservation requests. Status workflow:
--   new → contacted → confirmed / declined / cancelled / completed / no_show

CREATE TABLE IF NOT EXISTS reservation_enquiries (
  id      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text        NOT NULL,
  phone   text        NOT NULL,
  -- 'date', 'time', 'guests', 'notes' are the original field names.
  -- migration_001 adds the normalised aliases (reservation_date, preferred_time,
  -- guest_count, special_request) as additional columns alongside these.
  date    text,
  time    text,
  guests  text,
  notes   text,
  source  text        DEFAULT 'website',
  status  text        NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reservation_enquiries ENABLE ROW LEVEL SECURITY;

-- ─── katering_enquiries ───────────────────────────────────────────────────────
-- Stores catering / off-site event enquiries submitted via the Katering section.

CREATE TABLE IF NOT EXISTS katering_enquiries (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  phone      text        NOT NULL,
  event_type text,
  occasion   text,
  guests     text,
  date       text,
  message    text,
  source     text        DEFAULT 'website',
  status     text        NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE katering_enquiries ENABLE ROW LEVEL SECURITY;

-- ─── gifting_enquiries ────────────────────────────────────────────────────────
-- Stores corporate gifting and bulk-order enquiries.

CREATE TABLE IF NOT EXISTS gifting_enquiries (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text        NOT NULL,
  phone     text        NOT NULL,
  gift_type text,
  quantity  text,
  message   text,
  source    text        DEFAULT 'website',
  status    text        NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gifting_enquiries ENABLE ROW LEVEL SECURITY;
