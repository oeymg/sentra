-- Create demo_requests table to store demo booking requests
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),

  -- Contact Information
  full_name text not null,
  email text not null,
  phone text,
  company_name text not null,
  company_size text, -- e.g., '1-10', '11-50', '51-200', '201-500', '500+'
  job_title text,

  -- Business Details
  industry text,
  website text,
  current_review_volume text, -- e.g., 'less-than-50', '50-200', '200-1000', '1000+'

  -- Scheduling Preferences
  preferred_date date,
  preferred_time text,
  timezone text,

  -- Additional Context
  message text,
  how_did_you_hear text, -- e.g., 'google', 'referral', 'social-media', 'other'

  -- Status Tracking
  status text default 'pending', -- 'pending', 'contacted', 'scheduled', 'completed', 'cancelled'
  notes text, -- Internal notes for sales team

  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  contacted_at timestamptz,
  scheduled_for timestamptz
);

-- Create index on email for quick lookups
create index if not exists idx_demo_requests_email on public.demo_requests(email);

-- Create index on status for filtering
create index if not exists idx_demo_requests_status on public.demo_requests(status);

-- Create index on created_at for sorting
create index if not exists idx_demo_requests_created_at on public.demo_requests(created_at desc);

-- Enable Row Level Security
alter table public.demo_requests enable row level security;

-- Policy: Anyone can insert (submit demo request)
drop policy if exists "Anyone can submit demo request" on public.demo_requests;
create policy "Anyone can submit demo request"
  on public.demo_requests for insert
  with check (true);

-- Policy: Only authenticated users (admin) can view all requests
drop policy if exists "Admins can view all demo requests" on public.demo_requests;
create policy "Admins can view all demo requests"
  on public.demo_requests for select
  using (auth.role() = 'authenticated');

-- Policy: Only authenticated users (admin) can update requests
drop policy if exists "Admins can update demo requests" on public.demo_requests;
create policy "Admins can update demo requests"
  on public.demo_requests for update
  using (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
create or replace function public.handle_demo_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_demo_request_updated on public.demo_requests;
create trigger on_demo_request_updated
  before update on public.demo_requests
  for each row
  execute procedure public.handle_demo_requests_updated_at();
