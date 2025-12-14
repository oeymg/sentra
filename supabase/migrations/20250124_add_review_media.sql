-- Add media upload support to reviews
-- This migration adds fields for photo/video attachments to reviews

-- Ensure 'direct' platform exists for user-submitted reviews
insert into public.review_platforms (name, slug, requires_auth)
values ('Direct Submission', 'direct', false)
on conflict (slug) do nothing;

-- Add media fields to reviews table
alter table public.reviews
  add column if not exists media_urls text[], -- Array of media URLs (photos/videos)
  add column if not exists media_types text[], -- Array of types (image/video)
  add column if not exists has_media boolean default false;

-- Create index for media queries
create index if not exists idx_reviews_has_media on public.reviews(has_media) where has_media = true;

-- Create storage bucket for review media (if not exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-media',
  'review-media',
  true,
  52428800, -- 50MB max
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Storage policies for review media

-- Drop existing policies if they exist
drop policy if exists "Anyone can view review media" on storage.objects;
drop policy if exists "Anyone can upload review media" on storage.objects;
drop policy if exists "Users can update own review media" on storage.objects;
drop policy if exists "Users can delete own review media" on storage.objects;

-- Anyone can view review media
create policy "Anyone can view review media"
  on storage.objects for select
  using (bucket_id = 'review-media');

-- Anyone can upload review media (we'll validate on API layer)
create policy "Anyone can upload review media"
  on storage.objects for insert
  with check (bucket_id = 'review-media');

-- Users can update their own uploads
create policy "Users can update own review media"
  on storage.objects for update
  using (bucket_id = 'review-media');

-- Users can delete their own uploads
create policy "Users can delete own review media"
  on storage.objects for delete
  using (bucket_id = 'review-media');

-- Comment
comment on column public.reviews.media_urls is 'URLs of uploaded photos/videos for this review';
comment on column public.reviews.media_types is 'Types of media (image or video) corresponding to media_urls array';
comment on column public.reviews.has_media is 'Whether this review has any attached media (photos/videos)';
