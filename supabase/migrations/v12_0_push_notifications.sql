-- =============================================================
-- v12.0 — Push notification foundation
-- =============================================================
-- Run this in Supabase SQL Editor before deploying mobile v12.0.
-- It is safe to re-run (everything is IF NOT EXISTS / DROP IF EXISTS).
--
-- What this creates:
--   1. customer_devices table — one row per (customer, device) so a user
--      can be signed in on multiple phones and receive pushes on all of
--      them. Stores the Expo push token, platform, and a last_seen_at
--      so we can prune dead tokens later.
--   2. notifications_enabled boolean on customers — master kill switch
--      the user can toggle from Settings. Defaults to true (we'll prompt
--      for permission anyway; if they decline OS-level we just never
--      register a token).
--   3. RLS so each customer can only manage their own device rows.
-- =============================================================


-- -------------------------------------------------------------
-- 1. notifications_enabled flag on customers
-- -------------------------------------------------------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;


-- -------------------------------------------------------------
-- 2. customer_devices table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform        text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_devices_customer_idx
  ON public.customer_devices (customer_id);


-- -------------------------------------------------------------
-- 3. RLS — users can read/write only their own device rows.
--    Admins can read everything (for broadcast targeting later).
-- -------------------------------------------------------------
ALTER TABLE public.customer_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_devices_own_select ON public.customer_devices;
DROP POLICY IF EXISTS customer_devices_own_insert ON public.customer_devices;
DROP POLICY IF EXISTS customer_devices_own_update ON public.customer_devices;
DROP POLICY IF EXISTS customer_devices_own_delete ON public.customer_devices;

CREATE POLICY customer_devices_own_select
  ON public.customer_devices
  FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY customer_devices_own_insert
  ON public.customer_devices
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    OR customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY customer_devices_own_update
  ON public.customer_devices
  FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY customer_devices_own_delete
  ON public.customer_devices
  FOR DELETE
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );


-- =============================================================
-- VERIFY
-- =============================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='customer_devices'
-- ORDER BY ordinal_position;
--
-- SELECT polname FROM pg_policy
-- WHERE polname LIKE 'customer_devices_own_%';
