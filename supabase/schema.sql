-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Businesses table
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  address text,
  industry text,
  website text,
  logo_url text,
  google_place_id text,
  yelp_business_id text,
  tripadvisor_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.businesses enable row level security;

create policy "Users can view own businesses"
  on public.businesses for select
  using (auth.uid() = user_id);

create policy "Users can create businesses"
  on public.businesses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own businesses"
  on public.businesses for update
  using (auth.uid() = user_id);

create policy "Users can delete own businesses"
  on public.businesses for delete
  using (auth.uid() = user_id);

-- Review platforms table
create table public.review_platforms (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null,
  icon_url text,
  api_endpoint text,
  requires_auth boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default platforms
insert into public.review_platforms (name, slug, requires_auth) values
  ('Google Reviews', 'google', true),
  ('Reddit', 'reddit', false),
  ('Yelp', 'yelp', true),
  ('Trustpilot', 'trustpilot', true),
  ('Facebook', 'facebook', true),
  ('Tripadvisor', 'tripadvisor', true),
  ('Amazon', 'amazon', false),
  ('Apple App Store', 'app-store', false),
  ('Google Play Store', 'play-store', false),
  ('BBB (Better Business Bureau)', 'bbb', false),
  ('Glassdoor', 'glassdoor', false),
  ('G2', 'g2', false),
  ('Capterra', 'capterra', false),
  ('Product Hunt', 'product-hunt', false),
  ('Angi', 'angi', false),
  ('Houzz', 'houzz', false),
  ('OpenTable', 'opentable', false),
  ('Zomato', 'zomato', false),
  ('Booking.com', 'booking', false),
  ('Expedia', 'expedia', false),
  ('Hotels.com', 'hotels', false);

-- Business platform connections
create table public.business_platforms (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  platform_id uuid references public.review_platforms(id) on delete cascade not null,
  platform_business_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_connected boolean default false,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(business_id, platform_id)
);

alter table public.business_platforms enable row level security;

create policy "Users can view own business platforms"
  on public.business_platforms for select
  using (exists (
    select 1 from public.businesses
    where businesses.id = business_platforms.business_id
    and businesses.user_id = auth.uid()
  ));

create policy "Users can manage own business platforms"
  on public.business_platforms for all
  using (exists (
    select 1 from public.businesses
    where businesses.id = business_platforms.business_id
    and businesses.user_id = auth.uid()
  ));

-- Reviews table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  platform_id uuid references public.review_platforms(id) on delete cascade not null,
  platform_review_id text not null,
  reviewer_name text,
  reviewer_avatar_url text,
  rating numeric(2,1) not null check (rating >= 0 and rating <= 5),
  review_text text,
  review_url text,
  reviewed_at timestamp with time zone not null,

  -- AI Analysis fields
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  sentiment_score numeric(3,2) check (sentiment_score >= -1 and sentiment_score <= 1),
  keywords text[],
  categories text[],
  language text,
  is_spam boolean default false,

  -- Response fields
  has_response boolean default false,
  response_text text,
  responded_at timestamp with time zone,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(platform_id, platform_review_id)
);

alter table public.reviews enable row level security;

create policy "Users can view reviews for own businesses"
  on public.reviews for select
  using (exists (
    select 1 from public.businesses
    where businesses.id = reviews.business_id
    and businesses.user_id = auth.uid()
  ));

create policy "Users can manage reviews for own businesses"
  on public.reviews for all
  using (exists (
    select 1 from public.businesses
    where businesses.id = reviews.business_id
    and businesses.user_id = auth.uid()
  ));

-- AI Generated Responses table
create table public.ai_responses (
  id uuid default uuid_generate_v4() primary key,
  review_id uuid references public.reviews(id) on delete cascade not null,
  response_text text not null,
  tone text check (tone in ('professional', 'friendly', 'apologetic', 'enthusiastic')),
  is_used boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_responses enable row level security;

create policy "Users can view AI responses for own reviews"
  on public.ai_responses for select
  using (exists (
    select 1 from public.reviews
    join public.businesses on businesses.id = reviews.business_id
    where reviews.id = ai_responses.review_id
    and businesses.user_id = auth.uid()
  ));

create policy "Users can manage AI responses for own reviews"
  on public.ai_responses for all
  using (exists (
    select 1 from public.reviews
    join public.businesses on businesses.id = reviews.business_id
    where reviews.id = ai_responses.review_id
    and businesses.user_id = auth.uid()
  ));

-- Analytics snapshots table
create table public.analytics_snapshots (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  snapshot_date date not null,
  total_reviews integer default 0,
  average_rating numeric(3,2),
  positive_reviews integer default 0,
  neutral_reviews integer default 0,
  negative_reviews integer default 0,
  response_rate numeric(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(business_id, snapshot_date)
);

alter table public.analytics_snapshots enable row level security;

create policy "Users can view analytics for own businesses"
  on public.analytics_snapshots for select
  using (exists (
    select 1 from public.businesses
    where businesses.id = analytics_snapshots.business_id
    and businesses.user_id = auth.uid()
  ));

-- Create indexes for better performance
create index idx_businesses_user_id on public.businesses(user_id);
create index idx_business_platforms_business_id on public.business_platforms(business_id);
create index idx_reviews_business_id on public.reviews(business_id);
create index idx_reviews_platform_id on public.reviews(platform_id);
create index idx_reviews_reviewed_at on public.reviews(reviewed_at desc);
create index idx_reviews_sentiment on public.reviews(sentiment);
create index idx_ai_responses_review_id on public.ai_responses(review_id);
create index idx_analytics_snapshots_business_date on public.analytics_snapshots(business_id, snapshot_date desc);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure update_updated_at_column();

create trigger update_businesses_updated_at before update on public.businesses
  for each row execute procedure update_updated_at_column();

create trigger update_business_platforms_updated_at before update on public.business_platforms
  for each row execute procedure update_updated_at_column();

create trigger update_reviews_updated_at before update on public.reviews
  for each row execute procedure update_updated_at_column();
