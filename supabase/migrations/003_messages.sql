-- ─── Messages ─────────────────────────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid not null references public.clinics(id) on delete cascade,
  patient_id  uuid not null references public.patients(id) on delete cascade,
  sender_role text not null check (sender_role in ('patient', 'admin')),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Patients can read/insert their own messages
create policy "messages: own patient read" on public.messages
  for select using (
    patient_id in (
      select id from public.patients where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Service role handles all writes and admin reads
create policy "messages: service role" on public.messages
  for all using (auth.role() = 'service_role');

-- Index for fast patient thread lookup
create index messages_patient_created on public.messages (patient_id, created_at);
create index messages_clinic_unread   on public.messages (clinic_id, read_at) where read_at is null;
