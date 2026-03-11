-- Add city / state / zip to locations (used by onboarding wizard and locations page)
alter table public.locations
  add column if not exists city  text,
  add column if not exists state text,
  add column if not exists zip   text;
