-- Add individual star rating columns to survey_submissions.
-- The old text columns (response_speed, work_quality, pricing) are kept for
-- backwards compatibility but are no longer required by the new survey flow.
alter table public.survey_submissions
  add column if not exists service_rating  smallint check (service_rating  >= 1 and service_rating  <= 5),
  add column if not exists quality_rating  smallint check (quality_rating  >= 1 and quality_rating  <= 5),
  add column if not exists speed_rating    smallint check (speed_rating    >= 1 and speed_rating    <= 5);
