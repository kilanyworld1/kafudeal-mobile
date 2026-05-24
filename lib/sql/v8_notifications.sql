-- KafuDeal v8: notifications system
-- Run once in Supabase SQL editor before installing the v8 app build.

-- 1. notifications table -------------------------------------------------------

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  related_id text,
  related_type text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_customer_created_idx
  on notifications(customer_id, created_at desc);

create index if not exists notifications_customer_unread_idx
  on notifications(customer_id) where read = false;

-- 2. Trigger: order placed -----------------------------------------------------

create or replace function notify_on_order_placed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is null then
    return new;
  end if;
  insert into notifications (customer_id, type, title, body, related_id, related_type)
  values (
    new.customer_id,
    'order_placed',
    'Order confirmed ✓',
    'Your order #' || upper(substring(new.id::text, 1, 8)) || ' is on its way to being prepared.',
    new.id::text,
    'order'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_on_order_placed on orders;
create trigger trg_notify_on_order_placed
  after insert on orders
  for each row execute function notify_on_order_placed();

-- 3. Trigger: order status change ---------------------------------------------

create or replace function notify_on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_body  text;
  v_short text;
begin
  if new.order_status = old.order_status then
    return new;
  end if;
  if new.customer_id is null then
    return new;
  end if;

  v_short := upper(substring(new.id::text, 1, 8));

  case new.order_status::text
    when 'confirmed' then
      v_title := 'Order confirmed ✓';
      v_body  := 'Order #' || v_short || ' has been confirmed by the store.';
    when 'preparing' then
      v_title := 'Preparing your order 📦';
      v_body  := 'The store is putting your items together.';
    when 'ready_for_delivery' then
      v_title := 'Ready for the driver 🛍️';
      v_body  := 'Your order is packed and waiting for pickup.';
    when 'ready_for_pickup' then
      v_title := 'Ready for pickup 🛍️';
      v_body  := 'Your order is ready when you are.';
    when 'out_for_delivery' then
      v_title := 'On the way 🛵';
      v_body  := 'Your driver is heading to you.';
    when 'delivered' then
      v_title := 'Delivered ✅';
      v_body  := 'Your order arrived. Enjoy!';
    when 'cancelled' then
      v_title := 'Order cancelled';
      v_body  := 'Order #' || v_short || ' was cancelled. Tap for details.';
    when 'refunded' then
      v_title := 'Refund processed 💸';
      v_body  := 'Your refund for order #' || v_short || ' has been issued.';
    else
      v_title := 'Order updated';
      v_body  := 'Status changed to ' || new.order_status::text;
  end case;

  insert into notifications (customer_id, type, title, body, related_id, related_type)
  values (
    new.customer_id,
    'order_status_' || new.order_status::text,
    v_title,
    v_body,
    new.id::text,
    'order'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_on_order_status_change on orders;
create trigger trg_notify_on_order_status_change
  after update of order_status on orders
  for each row execute function notify_on_order_status_change();

-- 4. RLS — customers only see and update their own notifications --------------

alter table notifications enable row level security;

drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications
  for select using (
    customer_id in (
      select id from customers where auth_user_id = auth.uid()
    )
  );

drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications
  for update using (
    customer_id in (
      select id from customers where auth_user_id = auth.uid()
    )
  ) with check (
    customer_id in (
      select id from customers where auth_user_id = auth.uid()
    )
  );

-- Inserts only happen via the SECURITY DEFINER triggers above, so no INSERT
-- policy is needed (and we explicitly don't want clients writing directly).

-- 5. Realtime — add notifications to the supabase_realtime publication --------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table notifications';
  end if;
end$$;

-- 6. Sanity check -------------------------------------------------------------

select
  (select count(*) from notifications) as existing_rows,
  (select count(*) from pg_trigger where tgrelid = 'orders'::regclass
    and tgname in ('trg_notify_on_order_placed','trg_notify_on_order_status_change')) as triggers_installed;
