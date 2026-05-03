-- Enable RLS on review_platforms.
-- This is a read-only reference table (Google, Yelp, TripAdvisor, etc.).
-- All authenticated users need to read it; nobody but the service role writes to it.

alter table public.review_platforms enable row level security;

create policy "Anyone can read review platforms"
  on public.review_platforms
  for select
  using (true);
