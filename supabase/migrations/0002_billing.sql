-- Phase 2 backend: Stripe billing. See docs/BACKEND.md.
-- Apply after 0001_init.sql. Re-runnable.
--
-- The Stripe customer/subscription ids and the period end are written ONLY by
-- the stripe-webhook Edge Function (service role, bypasses RLS). Clients keep
-- read-only access to their own profile via the policy from 0001.

alter table public.profiles add column if not exists stripe_customer_id     text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists current_period_end     timestamptz;

create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);
