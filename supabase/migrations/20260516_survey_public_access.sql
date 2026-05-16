-- Allow anyone (logged out included) to read basic business info
-- needed for the public-facing survey page at /review/[slug].
create policy "Public can read businesses"
  on public.businesses
  for select
  using (true);

-- Page-view tracking for survey pages.
-- Separate from qr_scans so we can distinguish channel (qr, nfc, direct, link).
create table if not exists public.survey_page_views (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source      text not null default 'direct', -- 'qr' | 'nfc' | 'link' | 'direct'
  created_at  timestamptz not null default now()
);

create index survey_page_views_business_id_idx on public.survey_page_views(business_id);
create index survey_page_views_created_at_idx  on public.survey_page_views(created_at desc);

alter table public.survey_page_views enable row level security;

-- Business owners can read their own page views
create policy "Business owners can view their page views"
  on public.survey_page_views for select
  using (
    business_id in (
      select id from public.businesses where user_id = auth.uid()
    )
  );

-- Anyone can insert a page view (public survey page fires this)
create policy "Anyone can insert page views"
  on public.survey_page_views for insert
  with check (true);
