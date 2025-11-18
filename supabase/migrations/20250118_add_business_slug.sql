-- Add slug column to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_idx ON public.businesses(slug);

-- Function to generate slug from business name
CREATE OR REPLACE FUNCTION generate_slug(input_text text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special characters
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'business';
  END IF;

  -- Check for uniqueness and add counter if needed
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing businesses that don't have one
UPDATE public.businesses
SET slug = generate_slug(name)
WHERE slug IS NULL OR slug = '';

-- Make slug NOT NULL after populating existing rows
ALTER TABLE public.businesses ALTER COLUMN slug SET NOT NULL;

-- Add comment
COMMENT ON COLUMN public.businesses.slug IS 'URL-friendly unique identifier for the business';
