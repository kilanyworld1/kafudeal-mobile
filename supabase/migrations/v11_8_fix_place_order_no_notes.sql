-- =============================================================
-- v11.8 HOTFIX — drop 'notes' from place_order RPC
-- =============================================================
-- The first version of place_order tried to insert into a `notes`
-- column on the orders table that doesn't actually exist:
--
--   ERROR: column "notes" of relation "orders" does not exist
--
-- This re-creates the RPC without the notes column (and without
-- the p_notes parameter). Everything else stays the same.
--
-- Safe to re-run.
-- =============================================================

CREATE OR REPLACE FUNCTION public.place_order(
  p_delivery_address text,
  p_payment_method   text DEFAULT 'Card',
  p_notes            text DEFAULT NULL   -- accepted but ignored, kept so
                                         -- the mobile call signature still
                                         -- works without changes
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
  SELECT id, name, email, phone INTO v_customer
  FROM customers
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_customer.id IS NULL THEN
    RAISE EXCEPTION 'Not signed in or customer profile missing';
  END IF;

  IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) < 5 THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM cart_items WHERE customer_id = v_customer.id
  ) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  FOR v_partner_id IN
    SELECT DISTINCT p.partner_id
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = v_customer.id
  LOOP
    SELECT
      COALESCE(SUM(COALESCE(p.discounted_price, p.original_price) * ci.quantity), 0),
      COUNT(*)::int
    INTO v_subtotal, v_item_count
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = v_customer.id
      AND p.partner_id   = v_partner_id;

    IF v_item_count = 0 THEN CONTINUE; END IF;

    -- NO `notes` column here — that's the fix.
    INSERT INTO orders (
      customer_id, partner_id,
      customer_name, customer_email, customer_phone,
      delivery_address, payment_method,
      item_count, subtotal, total,
      order_status, payment_status
    ) VALUES (
      v_customer.id, v_partner_id,
      v_customer.name, v_customer.email, v_customer.phone,
      p_delivery_address, p_payment_method,
      v_item_count, v_subtotal, v_subtotal,
      'confirmed', 'pending'
    )
    RETURNING id INTO v_order_id;

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

  DELETE FROM cart_items WHERE customer_id = v_customer.id;

  RETURN jsonb_build_object(
    'success',          true,
    'primary_order_id', v_order_ids[1],
    'order_ids',        v_order_ids,
    'order_count',      v_total_inserted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(text, text, text) TO authenticated;
