-- Review Generation Campaigns Tables

-- campaigns table
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  type text not null default 'email' check (type in ('email', 'sms', 'qr_code')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'completed')),

  -- Template
  subject_line text,
  email_template text,
  sms_template text,

  -- Targeting
  target_platform text default 'google', -- 'google', 'yelp', 'tripadvisor', etc.
  review_url text,

  -- Scheduling
  scheduled_at timestamp with time zone,
  send_at_time time, -- e.g., '10:00:00' for 10am sends
  timezone text default 'UTC',

  -- Settings
  enable_followup boolean default false,
  followup_delay_days integer default 3,
  max_followups integer default 2,

  -- Stats
  total_sent integer default 0,
  total_opened integer default 0,
  total_clicked integer default 0,
  total_reviewed integer default 0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists campaigns_business_id_idx on public.campaigns(business_id);
create index if not exists campaigns_status_idx on public.campaigns(status);

-- campaign_recipients table
create table if not exists public.campaign_recipients (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,

  -- Customer info
  email text not null,
  name text,
  phone text,

  -- Tracking
  status text not null default 'pending' check (status in ('pending', 'sent', 'opened', 'clicked', 'reviewed', 'bounced', 'unsubscribed')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  reviewed_at timestamp with time zone,

  -- Unique tracking token
  tracking_token text unique not null default encode(gen_random_bytes(16), 'hex'),

  -- Review data
  review_id uuid references public.reviews(id),
  review_platform text,
  review_rating integer,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists campaign_recipients_campaign_id_idx on public.campaign_recipients(campaign_id);
create index if not exists campaign_recipients_tracking_token_idx on public.campaign_recipients(tracking_token);
create index if not exists campaign_recipients_status_idx on public.campaign_recipients(status);
create index if not exists campaign_recipients_email_idx on public.campaign_recipients(email);

-- campaign_events table
create table if not exists public.campaign_events (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  recipient_id uuid references public.campaign_recipients(id) on delete cascade not null,

  event_type text not null check (event_type in ('sent', 'opened', 'clicked', 'reviewed', 'bounced', 'unsubscribed')),
  event_data jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists campaign_events_campaign_id_idx on public.campaign_events(campaign_id);
create index if not exists campaign_events_recipient_id_idx on public.campaign_events(recipient_id);
create index if not exists campaign_events_type_idx on public.campaign_events(event_type);
create index if not exists campaign_events_created_at_idx on public.campaign_events(created_at desc);

-- RLS Policies

-- campaigns
alter table public.campaigns enable row level security;

create policy "Users can view their own business campaigns"
  on public.campaigns for select
  using (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

create policy "Users can create campaigns for their businesses"
  on public.campaigns for insert
  with check (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

create policy "Users can update their own business campaigns"
  on public.campaigns for update
  using (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their own business campaigns"
  on public.campaigns for delete
  using (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

-- campaign_recipients
alter table public.campaign_recipients enable row level security;

create policy "Users can view their campaign recipients"
  on public.campaign_recipients for select
  using (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

create policy "Users can create recipients for their campaigns"
  on public.campaign_recipients for insert
  with check (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

create policy "Users can update their campaign recipients"
  on public.campaign_recipients for update
  using (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their campaign recipients"
  on public.campaign_recipients for delete
  using (
    business_id in (
      select id from public.businesses
      where user_id = auth.uid()
    )
  );

-- campaign_events
alter table public.campaign_events enable row level security;

create policy "Users can view their campaign events"
  on public.campaign_events for select
  using (
    campaign_id in (
      select id from public.campaigns
      where business_id in (
        select id from public.businesses
        where user_id = auth.uid()
      )
    )
  );

create policy "Service role can create campaign events"
  on public.campaign_events for insert
  with check (true); -- Service role only, for tracking

-- Trigger to update campaign stats
create or replace function update_campaign_stats()
returns trigger as $$
begin
  if NEW.status = 'sent' and (OLD.status is null or OLD.status != 'sent') then
    update public.campaigns
    set total_sent = total_sent + 1
    where id = NEW.campaign_id;
  end if;

  if NEW.status = 'opened' and (OLD.status is null or OLD.status not in ('opened', 'clicked', 'reviewed')) then
    update public.campaigns
    set total_opened = total_opened + 1
    where id = NEW.campaign_id;
  end if;

  if NEW.status = 'clicked' and (OLD.status is null or OLD.status not in ('clicked', 'reviewed')) then
    update public.campaigns
    set total_clicked = total_clicked + 1
    where id = NEW.campaign_id;
  end if;

  if NEW.status = 'reviewed' and (OLD.status is null or OLD.status != 'reviewed') then
    update public.campaigns
    set total_reviewed = total_reviewed + 1
    where id = NEW.campaign_id;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger update_campaign_stats_trigger
  after update on public.campaign_recipients
  for each row
  execute function update_campaign_stats();
