-- Add contact and identity fields to businesses if not already present.
alter table public.businesses
  add column if not exists phone   text,
  add column if not exists website text;
