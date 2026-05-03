-- QR code scan tracking
create table if not exists qr_scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  user_agent text
);

create index qr_scans_business_id_idx on qr_scans(business_id);
create index qr_scans_scanned_at_idx on qr_scans(scanned_at desc);

alter table qr_scans enable row level security;

create policy "Business owners can view their qr scans"
  on qr_scans for select
  using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- Allow inserts without authentication (public QR scan page)
create policy "Anyone can insert qr scans"
  on qr_scans for insert
  with check (true);

-- Survey submissions (customer survey → AI-generated review)
create table if not exists survey_submissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_type text,
  response_speed text,
  work_quality text,
  pricing text,
  additional_comments text,
  rating integer check (rating >= 1 and rating <= 5),
  generated_review text,
  is_private boolean not null default false,
  submitted_at timestamptz,
  google_redirect_clicked boolean not null default false,
  created_at timestamptz not null default now()
);

create index survey_submissions_business_id_idx on survey_submissions(business_id);
create index survey_submissions_submitted_at_idx on survey_submissions(submitted_at desc);
create index survey_submissions_rating_idx on survey_submissions(rating);

alter table survey_submissions enable row level security;

create policy "Business owners can view their survey submissions"
  on survey_submissions for select
  using (
    business_id in (
      select id from businesses where user_id = auth.uid()
    )
  );

-- Allow inserts and updates without authentication (public survey page)
create policy "Anyone can insert survey submissions"
  on survey_submissions for insert
  with check (true);

create policy "Anyone can update survey submissions"
  on survey_submissions for update
  using (true);
