-- Expand survey_submissions with richer customer input fields.
-- These feed the AI so every generated review is specific and unique.
alter table public.survey_submissions
  add column if not exists job_description text,
  add column if not exists highlights      text[],
  add column if not exists customer_name  text;
