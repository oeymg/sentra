-- Add video review support
-- This migration adds support for video reviews from Instagram, TikTok, YouTube, and other platforms

-- Video reviews table
create table public.video_reviews (
  id uuid default uuid_generate_v4() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,

  -- Video source info
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'vimeo', 'twitter', 'facebook', 'other')),
  video_url text not null,
  embed_url text, -- The embeddable iframe URL
  thumbnail_url text,

  -- Creator info
  creator_name text not null,
  creator_handle text,
  creator_avatar_url text,
  creator_follower_count integer,

  -- Video metadata
  title text,
  description text,
  duration_seconds integer,
  view_count integer default 0,
  like_count integer default 0,
  comment_count integer default 0,

  -- Review info
  rating numeric(2,1) check (rating >= 0 and rating <= 5),
  is_featured boolean default false,
  is_verified boolean default false,

  -- Timestamps
  posted_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.video_reviews enable row level security;

-- Policies
create policy "Anyone can view video reviews"
  on public.video_reviews for select
  using (true);

create policy "Users can manage video reviews for own businesses"
  on public.video_reviews for all
  using (exists (
    select 1 from public.businesses
    where businesses.id = video_reviews.business_id
    and businesses.user_id = auth.uid()
  ));

-- Indexes
create index idx_video_reviews_business_id on public.video_reviews(business_id);
create index idx_video_reviews_platform on public.video_reviews(platform);
create index idx_video_reviews_posted_at on public.video_reviews(posted_at desc);
create index idx_video_reviews_is_featured on public.video_reviews(is_featured) where is_featured = true;

-- Trigger for updated_at
create trigger update_video_reviews_updated_at before update on public.video_reviews
  for each row execute procedure update_updated_at_column();

-- Add video review fields to existing reviews table (for mixed text/video reviews)
alter table public.reviews
  add column if not exists has_video boolean default false,
  add column if not exists video_url text,
  add column if not exists video_platform text check (video_platform in ('instagram', 'tiktok', 'youtube', 'vimeo', 'twitter', 'facebook', 'other')),
  add column if not exists video_embed_url text,
  add column if not exists video_thumbnail_url text;

-- Comment
comment on table public.video_reviews is 'Stores video reviews from social media platforms like Instagram, TikTok, YouTube, etc.';
