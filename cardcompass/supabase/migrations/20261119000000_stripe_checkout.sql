-- =============================================================================
-- CardCompass – Stripe Checkout
-- Migration 20261119000000_stripe_checkout.sql
--
-- What it does
--   1. adds payment columns to cc_orders and cc_order_items
--   2. adds an order-number generator (only used if the database does not
--      generate order numbers itself)
--   3. adds cc_apply_paid_order(): marks an order as paid and reduces the stock
--      in ONE transaction, exactly once (Stripe may send an event twice)
--
-- Safe to run more than once: every statement uses IF NOT EXISTS / OR REPLACE.
-- Nothing is dropped, renamed or deleted. Existing data is not changed.
--
-- Run it in Supabase → SQL Editor (paste everything, "Run"), or with the CLI
-- (supabase db push). See docs/STRIPE-SETUP.md.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. cc_orders: payment + address snapshot columns
-- -----------------------------------------------------------------------------
alter table public.cc_orders add column if not exists stripe_session_id        text;
alter table public.cc_orders add column if not exists stripe_payment_intent_id text;
alter table public.cc_orders add column if not exists payment_status           text;
alter table public.cc_orders add column if not exists paid_at                  timestamptz;
alter table public.cc_orders add column if not exists customer_email           text;
alter table public.cc_orders add column if not exists shipping_address         jsonb;
alter table public.cc_orders add column if not exists billing_address          jsonb;
alter table public.cc_orders add column if not exists customer_note            text;
alter table public.cc_orders add column if not exists shipping_cents           integer;
alter table public.cc_orders add column if not exists subtotal_cents           integer;

-- One Stripe Checkout Session belongs to exactly one order (NULLs allowed).
create unique index if not exists cc_orders_stripe_session_id_key
  on public.cc_orders (stripe_session_id);

comment on column public.cc_orders.stripe_session_id        is 'Stripe Checkout Session id (cs_…), set by the Edge Function create-checkout.';
comment on column public.cc_orders.stripe_payment_intent_id is 'Stripe PaymentIntent id (pi_…), set by the stripe-webhook function.';
comment on column public.cc_orders.payment_status           is 'unpaid | processing (e.g. SEPA pending) | paid | failed | expired – written by create-checkout / stripe-webhook.';
comment on column public.cc_orders.paid_at                  is 'Time the payment was confirmed by Stripe (cc_apply_paid_order).';
comment on column public.cc_orders.customer_email           is 'E-mail address entered at checkout (guest or customer).';
comment on column public.cc_orders.shipping_address         is 'Snapshot of the delivery address at checkout (first_name, last_name, company, address_line1, address_line2, postal_code, city, country_code, phone, shipping_method).';
comment on column public.cc_orders.billing_address          is 'Snapshot of the billing address at checkout (same keys; same_as_shipping = true when identical).';
comment on column public.cc_orders.customer_note            is 'Optional note from the customer (max. 1000 characters).';
comment on column public.cc_orders.shipping_cents           is 'Shipping cost in cent, computed on the server.';
comment on column public.cc_orders.subtotal_cents           is 'Sum of all items in cent (without shipping), computed on the server.';

-- -----------------------------------------------------------------------------
-- 2. cc_order_items: which variant, at which price
-- -----------------------------------------------------------------------------
alter table public.cc_order_items add column if not exists variant_id       uuid;
alter table public.cc_order_items add column if not exists unit_price_cents integer;

comment on column public.cc_order_items.variant_id       is 'cc_product_variants.id of the ordered variant (used to reduce stock after payment).';
comment on column public.cc_order_items.unit_price_cents is 'Price per piece in cent at the time of the order, taken from cc_product_variants on the server.';

-- Foreign key to the variant (only if possible; keeps history if a variant is deleted).
do $$
begin
  if not exists (
       select 1 from pg_constraint
        where conname = 'cc_order_items_variant_id_fkey'
          and conrelid = 'public.cc_order_items'::regclass)
     and exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'cc_product_variants'
          and column_name = 'id' and data_type = 'uuid')
     and exists (
       select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'cc_order_items'
          and column_name = 'variant_id' and data_type = 'uuid')
  then
    alter table public.cc_order_items
      add constraint cc_order_items_variant_id_fkey
      foreign key (variant_id) references public.cc_product_variants (id) on delete set null;
  end if;
exception when others then
  raise notice 'cc_order_items.variant_id foreign key not added: %', sqlerrm;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Order numbers "CC-YYYY-NNNNNN"
--    create-checkout first lets the database fill order_number itself (default
--    or trigger, if the shop already has one). Only if that does not happen it
--    calls this function.
-- -----------------------------------------------------------------------------
create sequence if not exists public.cc_stripe_order_seq;

comment on sequence public.cc_stripe_order_seq is 'Running number for CC-YYYY-NNNNNN order numbers created by the Stripe checkout.';

-- Start after the highest existing number so new numbers continue the series.
do $$
declare
  v_max bigint;
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'cc_orders' and column_name = 'order_number') then
    execute $q$
      select max((regexp_match(order_number, '(\d+)$'))[1]::bigint)
        from public.cc_orders
       where order_number ~ '^CC-\d{4}-\d+$'
    $q$ into v_max;
    if v_max is not null and v_max >= (select last_value from public.cc_stripe_order_seq) then
      perform setval('public.cc_stripe_order_seq', v_max);
    end if;
  end if;
end $$;

create or replace function public.cc_stripe_order_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_year  text := to_char(now() at time zone 'Europe/Berlin', 'YYYY');
  v_no    text;
  v_tries integer := 0;
begin
  loop
    v_no := 'CC-' || v_year || '-' || lpad(nextval('public.cc_stripe_order_seq')::text, 6, '0');
    -- never hand out a number that already exists
    exit when not exists (select 1 from public.cc_orders where order_number = v_no);
    v_tries := v_tries + 1;
    if v_tries > 1000 then
      raise exception 'cc_stripe_order_number: no free order number found';
    end if;
  end loop;
  return v_no;
end;
$$;

comment on function public.cc_stripe_order_number() is
  'Returns the next free order number CC-YYYY-NNNNNN. Only for the create-checkout Edge Function (service role).';

-- -----------------------------------------------------------------------------
-- 4. cc_apply_paid_order(order, payment_intent)
--    Called by the stripe-webhook Edge Function when Stripe confirms a payment.
--    In one transaction:
--      * locks the order row (concurrent deliveries of the same event wait),
--      * returns 'already_paid' if it was handled before (idempotent),
--      * sets status/payment_status = 'paid', paid_at, stripe_payment_intent_id,
--      * reduces cc_inventory.available for every ordered variant, never below 0.
--    Returns jsonb: {"result": "paid" | "already_paid" | "not_found",
--                    "shortfall": [ {variant_id, ordered, available}, … ]}
--    "shortfall" lists variants that had less stock than ordered (sold twice at
--    the same moment) – such orders need a manual look.
-- -----------------------------------------------------------------------------
create or replace function public.cc_apply_paid_order(p_order_id uuid, p_payment_intent text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment_status text;
  v_inv_col        text;
  v_item           record;
  v_available      integer;
  v_rows           integer;
  v_shortfall      jsonb := '[]'::jsonb;
begin
  select o.payment_status
    into v_payment_status
    from public.cc_orders o
   where o.id = p_order_id
     for update;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  if v_payment_status = 'paid' then
    return jsonb_build_object('result', 'already_paid');
  end if;

  update public.cc_orders
     set status                   = 'paid',
         payment_status           = 'paid',
         paid_at                  = coalesce(paid_at, now()),
         stripe_payment_intent_id = coalesce(p_payment_intent, stripe_payment_intent_id)
   where id = p_order_id;

  -- Column in cc_inventory that points to cc_product_variants (normally
  -- "variant_id"); read from the foreign key so a different name still works.
  select a.attname
    into v_inv_col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
   where c.contype = 'f'
     and c.conrelid = 'public.cc_inventory'::regclass
     and c.confrelid = 'public.cc_product_variants'::regclass
   limit 1;
  v_inv_col := coalesce(v_inv_col, 'variant_id');

  for v_item in
    select oi.variant_id, sum(oi.quantity)::integer as qty
      from public.cc_order_items oi
     where oi.order_id = p_order_id
       and oi.variant_id is not null
     group by oi.variant_id
     order by oi.variant_id            -- fixed lock order → no deadlocks
  loop
    execute format('select available from public.cc_inventory where %I::text = $1::text limit 1 for update', v_inv_col)
       into v_available
      using v_item.variant_id;
    get diagnostics v_rows = row_count;

    if v_rows = 0 or v_available is null or v_available < v_item.qty then
      v_shortfall := v_shortfall || jsonb_build_array(jsonb_build_object(
        'variant_id', v_item.variant_id,
        'ordered',    v_item.qty,
        'available',  v_available));
    end if;

    execute format('update public.cc_inventory set available = greatest(0, coalesce(available, 0) - $1) where %I::text = $2::text', v_inv_col)
      using v_item.qty, v_item.variant_id;
  end loop;

  return jsonb_build_object('result', 'paid', 'shortfall', v_shortfall);
end;
$$;

comment on function public.cc_apply_paid_order(uuid, text) is
  'Marks an order as paid and reduces stock exactly once (idempotent). Only for the stripe-webhook Edge Function (service role).';

-- -----------------------------------------------------------------------------
-- 5. Permissions: only the service role (Edge Functions) may call these.
--    Supabase grants EXECUTE to anon/authenticated by default – revoke it.
-- -----------------------------------------------------------------------------
revoke all on function public.cc_apply_paid_order(uuid, text) from public;
revoke all on function public.cc_apply_paid_order(uuid, text) from anon, authenticated;
grant execute on function public.cc_apply_paid_order(uuid, text) to service_role;

revoke all on function public.cc_stripe_order_number() from public;
revoke all on function public.cc_stripe_order_number() from anon, authenticated;
grant execute on function public.cc_stripe_order_number() to service_role;

revoke all on sequence public.cc_stripe_order_seq from public;
revoke all on sequence public.cc_stripe_order_seq from anon, authenticated;
grant usage, select on sequence public.cc_stripe_order_seq to service_role;

commit;
