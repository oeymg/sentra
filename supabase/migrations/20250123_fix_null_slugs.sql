-- Fix any existing businesses with null or empty slugs
-- This migration ensures all businesses have a valid slug

-- Update any businesses with null slugs to use their ID
update public.businesses
set slug = id::text
where slug is null or slug = '';

-- Add a trigger to prevent null slugs in the future
create or replace function ensure_business_slug()
returns trigger as $$
begin
  -- If slug is null or empty, generate one from the name or use the ID
  if NEW.slug is null or trim(NEW.slug) = '' then
    -- Try to generate from name first
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);

    -- If still empty, use the ID
    if NEW.slug = '' then
      NEW.slug := NEW.id::text;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Create trigger for INSERT operations
drop trigger if exists ensure_business_slug_trigger on public.businesses;
create trigger ensure_business_slug_trigger
  before insert on public.businesses
  for each row
  execute function ensure_business_slug();

-- Create trigger for UPDATE operations
drop trigger if exists ensure_business_slug_update_trigger on public.businesses;
create trigger ensure_business_slug_update_trigger
  before update on public.businesses
  for each row
  when (NEW.slug is distinct from OLD.slug)
  execute function ensure_business_slug();
