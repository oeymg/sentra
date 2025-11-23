-- Add pricing tier columns to businesses table
alter table public.businesses
  add column plan_tier text not null default 'free' check (plan_tier in ('free', 'pro', 'enterprise')),
  add column subscription_status text not null default 'active' check (subscription_status in ('active', 'trial', 'cancelled', 'expired', 'past_due')),
  add column subscription_id text,
  add column stripe_customer_id text,
  add column plan_started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  add column plan_expires_at timestamp with time zone,
  add column trial_ends_at timestamp with time zone,
  add column ai_responses_used_this_month integer default 0 not null,
  add column ai_responses_reset_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Create index for plan lookups
create index idx_businesses_plan_tier on public.businesses(plan_tier);
create index idx_businesses_subscription_status on public.businesses(subscription_status);

-- Create a function to reset AI response counters monthly
create or replace function reset_ai_response_counters()
returns void as $$
begin
  update public.businesses
  set
    ai_responses_used_this_month = 0,
    ai_responses_reset_at = timezone('utc'::text, now())
  where
    ai_responses_reset_at < timezone('utc'::text, now()) - interval '1 month';
end;
$$ language plpgsql security definer;

-- Comment explaining the columns
comment on column public.businesses.plan_tier is 'Subscription plan tier: free, pro, or enterprise';
comment on column public.businesses.subscription_status is 'Current subscription status';
comment on column public.businesses.subscription_id is 'Stripe subscription ID';
comment on column public.businesses.stripe_customer_id is 'Stripe customer ID';
comment on column public.businesses.plan_expires_at is 'When the current plan expires (for cancelled subscriptions)';
comment on column public.businesses.trial_ends_at is 'When the trial period ends (for trial subscriptions)';
comment on column public.businesses.ai_responses_used_this_month is 'Number of AI responses used this month (for free tier limits)';
comment on column public.businesses.ai_responses_reset_at is 'When the AI response counter was last reset';
