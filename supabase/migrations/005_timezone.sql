-- Add timezone column to clinics (defaults to US Eastern)
alter table public.clinics
  add column if not exists timezone text not null default 'America/New_York';

-- Update the Lumen demo clinic to use a sensible default
update public.clinics set timezone = 'America/New_York' where slug = 'lumen';
