-- Ensure TripAdvisor platform exists in review_platforms table
INSERT INTO public.review_platforms (name, slug, icon_emoji, description, is_active)
VALUES (
  'TripAdvisor',
  'tripadvisor',
  '✈️',
  'TripAdvisor reviews synced using AI-powered web scraping',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon_emoji = EXCLUDED.icon_emoji,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;
