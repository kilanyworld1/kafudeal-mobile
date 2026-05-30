-- =============================================================
-- v11.6.1  HOTFIX  — RLS policies for customer_addresses
-- =============================================================
-- The previous migration covered customers / admin_users /
-- customer_notifications / products but forgot customer_addresses.
-- Without these policies a signed-in customer cannot read or write
-- their own saved addresses, so the checkout flow gets stuck on
-- "Choose a delivery address".
--
-- This script grants each customer full access to ONLY their own
-- rows, and grants admins read/write to everyone's.
--
-- Safe to re-run (DROP IF EXISTS / CREATE).
-- =============================================================

-- Make sure RLS is on for the table
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Drop anything we might have left from earlier
DROP POLICY IF EXISTS customer_addresses_own_select  ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_own_insert  ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_own_update  ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_own_delete  ON public.customer_addresses;
DROP POLICY IF EXISTS customer_addresses_admin_all   ON public.customer_addresses;

-- SELECT: customer can read their own rows
CREATE POLICY customer_addresses_own_select
  ON public.customer_addresses
  FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- INSERT: customer can add a row, as long as customer_id resolves to
-- THEIR own customer row. WITH CHECK guards the inserted row.
CREATE POLICY customer_addresses_own_insert
  ON public.customer_addresses
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())
    OR customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- UPDATE: customer can edit their own rows (e.g. flip is_default)
CREATE POLICY customer_addresses_own_update
  ON public.customer_addresses
  FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );

-- DELETE: customer can delete their own rows
CREATE POLICY customer_addresses_own_delete
  ON public.customer_addresses
  FOR DELETE
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );


-- =============================================================
-- VERIFY (read-only — should return 4 policies)
-- =============================================================
-- SELECT polname FROM pg_policy
-- WHERE polname LIKE 'customer_addresses_own_%';
