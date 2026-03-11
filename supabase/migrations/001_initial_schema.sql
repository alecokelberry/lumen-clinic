-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Clinics ──────────────────────────────────────────────────────────────────
create table public.clinics (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  custom_domain  text unique,
  name           text not null,
  tagline        text,
  logo_url       text,
  hero_image_url text,
  primary_color  text not null default '#2563eb',
  accent_color   text default '#eff6ff',
  theme          jsonb not null default '{}',
  settings       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);
alter table public.clinics enable row level security;
-- Public read (marketing site needs clinic data without auth)
create policy "clinics: public read" on public.clinics
  for select using (true);
-- Only service role can write
create policy "clinics: service role write" on public.clinics
  for all using (auth.role() = 'service_role');

-- ─── Providers ────────────────────────────────────────────────────────────────
create table public.providers (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics(id) on delete cascade,
  name         text not null,
  title        text,
  bio          text,
  photo_url    text,
  specialties  text[] not null default '{}',
  npi          text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.providers enable row level security;
create policy "providers: public read" on public.providers
  for select using (true);
create policy "providers: service role write" on public.providers
  for all using (auth.role() = 'service_role');

-- ─── Locations ────────────────────────────────────────────────────────────────
create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  clinic_id  uuid not null references public.clinics(id) on delete cascade,
  name       text not null,
  address    text not null,
  phone      text,
  timezone   text not null default 'America/Denver',
  lat        numeric,
  lng        numeric,
  hours      jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.locations enable row level security;
create policy "locations: public read" on public.locations
  for select using (true);
create policy "locations: service role write" on public.locations
  for all using (auth.role() = 'service_role');

-- ─── Services ─────────────────────────────────────────────────────────────────
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics(id) on delete cascade,
  name         text not null,
  description  text,
  duration_min integer not null default 30,
  is_virtual   boolean not null default false,
  price_cents  integer,
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
alter table public.services enable row level security;
create policy "services: public read" on public.services
  for select using (true);
create policy "services: service role write" on public.services
  for all using (auth.role() = 'service_role');

-- ─── Provider Schedules ───────────────────────────────────────────────────────
create table public.provider_schedules (
  id                uuid primary key default gen_random_uuid(),
  provider_id       uuid not null references public.providers(id) on delete cascade,
  location_id       uuid not null references public.locations(id) on delete cascade,
  day_of_week       smallint not null check (day_of_week between 0 and 6), -- 0=Sun
  start_time        time not null,
  end_time          time not null,
  slot_duration_min integer not null default 30
);
alter table public.provider_schedules enable row level security;
create policy "provider_schedules: public read" on public.provider_schedules
  for select using (true);
create policy "provider_schedules: service role write" on public.provider_schedules
  for all using (auth.role() = 'service_role');

-- ─── Patients ─────────────────────────────────────────────────────────────────
create table public.patients (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics(id) on delete cascade,
  clerk_user_id text not null,
  first_name    text not null,
  last_name     text not null,
  dob           date,
  phone         text,
  email         text not null,
  insurance     jsonb,
  created_at    timestamptz not null default now(),
  unique (clinic_id, clerk_user_id)
);
alter table public.patients enable row level security;
-- Patients can only read/write their own record
create policy "patients: own record" on public.patients
  for all using (auth.jwt() ->> 'sub' = clerk_user_id);
create policy "patients: service role" on public.patients
  for all using (auth.role() = 'service_role');

-- ─── Appointments ─────────────────────────────────────────────────────────────
create table public.appointments (
  id                uuid primary key default gen_random_uuid(),
  clinic_id         uuid not null references public.clinics(id) on delete cascade,
  patient_id        uuid references public.patients(id) on delete set null,
  provider_id       uuid not null references public.providers(id),
  location_id       uuid not null references public.locations(id),
  service_id        uuid not null references public.services(id),
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  status            text not null default 'scheduled'
                      check (status in ('scheduled','confirmed','cancelled','no-show','completed')),
  is_virtual        boolean not null default false,
  meeting_url       text,
  reason            text,
  intake_answers    jsonb,
  confirmation_code text not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  guest_name        text,
  guest_email       text,
  guest_phone       text,
  created_at        timestamptz not null default now()
);
alter table public.appointments enable row level security;
-- Authenticated patients see their own appointments
create policy "appointments: own patient" on public.appointments
  for select using (
    patient_id in (
      select id from public.patients where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );
-- Guest bookings: readable by confirmation code via service role only
create policy "appointments: service role" on public.appointments
  for all using (auth.role() = 'service_role');

-- ─── Seed: Lumen Clinic ───────────────────────────────────────────────────────
insert into public.clinics (slug, name, tagline, primary_color, accent_color, settings)
values (
  'lumen',
  'Lumen Clinic',
  'Compassionate care — close to home.',
  '#2563eb',
  '#eff6ff',
  '{"nav": ["Services", "Providers", "Locations", "About"], "features": {"telehealth": true, "guestBooking": true}}'
);
