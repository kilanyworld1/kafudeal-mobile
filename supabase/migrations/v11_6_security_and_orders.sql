-- =============================================================
-- v11.6 SECURITY HARDENING + SAFE ORDER PLACEMENT
-- =============================================================
-- Run this in the Supabase SQL Editor BEFORE deploying mobile v11.6
-- or the new mobile build will hit "function place_order does not exist".
--
-- What this does:
--   1. is_admin() helper — breaks RLS recursion in admin policies
--   2. Replaces admin_users + customers policies to use is_admin()
--   3. Scopes notifications reads to the owning customer (no more world-read)
--   4. Adds place_order() RPC — server-side total calc + per-partner orders
--      so a tampered client can no longer set total=0 or payment_status='paid'
--   5. Fix from Claude Code's b12d156 — unpublished products RLS leak
--
-- All statements are idempotent (DROP IF EXISTS / CREATE OR REPLACE) so you
-- can re-run this file safely.
-- =============================================================


-- -------------------------------------------------------------
-- 1. Clean up any stale no-arg is_admin() if a previous run created it.
--    The DB already has public.is_admin(uid uuid) — we'll just use that.
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_admin();


-- -------------------------------------------------------------
-- 2. Replace admin_users policy — was self-referencing (recursion risk)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS admin_users_admins_only ON public.admin_users;
CREATE POLICY admin_users_admins_only
  ON public.admin_users
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- -------------------------------------------------------------
-- 3. Replace customers policy — was joining back into customers (recursion risk)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS customers_own_profile_only ON public.customers;
CREATE POLICY customers_own_profile_only
  ON public.customers
  FOR ALL
  USING (auth_user_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (auth_user_id = auth.uid() OR public.is_admin(auth.uid()));


-- -------------------------------------------------------------
-- 4. customer_notifications: stop world-reading; scope to owner + admins
--    (table is `customer_notifications`, not `notifications`)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS customer_notifications_public_read  ON public.customer_notifications;
DROP POLICY IF EXISTS customer_notifications_own_or_admin ON public.customer_notifications;
CREATE POLICY customer_notifications_own_or_admin
  ON public.customer_notifications
  FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- 5. Products: hide unpublished rows from non-admins (Claude Code b12d156)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS products_public_read     ON public.products;
DROP POLICY IF EXISTS products_published_only  ON public.products;
CREATE POLICY products_published_only
  ON public.products
  FOR SELECT
  USING (
    status = 'published'
    OR public.is_admin(auth.uid())
  );


-- -------------------------------------------------------------
-- 6. place_order() RPC — the heart of the security fix
-- -------------------------------------------------------------
-- BEFORE: client inserted into `orders` with client-supplied subtotal/total/
-- payment_status — any field could be tampered (set total=0, mark paid, etc.)
--
-- AFTER:  client calls place_order(delivery_address, payment_method, notes).
-- The function recomputes totals from the cart on the server, splits the
-- cart by partner (one order per partner), and forces safe initial status.
-- =============================================================
CREATE OR REPLACE FUNCTION public.place_order(
  p_delivery_address text,
  p_payment_method   text DEFAULT 'Card',
  p_notes            text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer       record;
  v_partner_id     uuid;
  v_subtotal       numeric;
  v_item_count     int;
  v_order_id       uuid;
  v_order_ids      uuid[] := '{}';
  v_total_inserted int    := 0;
BEGIN
  -- ----- 1. Find the calling customer -----
  SELECT id, name, email, phone INTO v_customer
  FROM customers
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_customer.id IS NULL THEN
    RAISE EXCEPTION 'Not signed in or customer profile missing';
  END IF;

  -- ----- 2. Basic input validation -----
  IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) < 5 THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  -- ----- 3. Bail out if cart is empty -----
  IF NOT EXISTS (
    SELECT 1 FROM cart_items WHERE customer_id = v_customer.id
  ) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- ----- 4. One order per partner: loop over distinct partner_ids -----
  FOR v_partner_id IN
    SELECT DISTINCT p.partner_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = v_customer.id
  LOOP
    -- Recompute subtotal + count for THIS partner from canonical product prices.
    -- Client cannot influence these numbers.
    SELECT
      COALESCE(SUM(COALESCE(p.discounted_price, p.original_price) * ci.quantity), 0),
      COUNT(*)::int
    INTO v_subtotal, v_item_count
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = v_customer.id
      AND p.partner_id   = v_partner_id;

    -- Defensive: if a partner ends up with zero items skip it
    IF v_item_count = 0 THEN CONTINUE; END IF;

    INSERT INTO orders (
      customer_id,
      partner_id,
      customer_name,
      customer_email,
      customer_phone,
      delivery_address,
      payment_method,
      notes,
      item_count,
      subtotal,
      total,
      order_status,
      payment_status
    ) VALUES (
      v_customer.id,
      v_partner_id,
      v_customer.name,
      v_customer.email,
      v_customer.phone,
      p_delivery_address,
      p_payment_method,
      p_notes,
      v_item_count,
      v_subtotal,
      v_subtotal,        -- delivery fee / voucher TODO when those are real
      'confirmed',       -- forced initial status — client can't bypass
      'pending'          -- forced initial status — client can't mark paid
    )
    RETURNING id INTO v_order_id;

    -- Copy this partner's cart lines into order_items at canonical prices
    INSERT INTO order_items (
      order_id, product_id, product_name, quantity, unit_price, total_price
    )
    SELECT
      v_order_id,
      p.id,
      p.name,
      ci.quantity,
      COALESCE(p.discounted_price, p.original_price),
      COALESCE(p.discounted_price, p.original_price) * ci.quantity
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = v_customer.id
      AND p.partner_id   = v_partner_id;

    v_order_ids      := array_append(v_order_ids, v_order_id);
    v_total_inserted := v_total_inserted + 1;
  END LOOP;

  -- ----- 5. Clear the cart in one shot -----
  DELETE FROM cart_items WHERE customer_id = v_customer.id;

  -- ----- 6. Return the new order id(s) so the client can navigate -----
  RETURN jsonb_build_object(
    'success',          true,
    'primary_order_id', v_order_ids[1],
    'order_ids',        v_order_ids,
    'order_count',      v_total_inserted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(text, text, text) TO authenticated;


-- =============================================================
-- VERIFY (read-only — run these to confirm everything took)
-- =============================================================
-- SELECT public.is_admin(auth.uid());
-- SELECT proname FROM pg_proc WHERE proname IN ('is_admin', 'place_order');
-- SELECT polname FROM pg_policy WHERE polname LIKE '%customer_notifications%';
