-- ─── Medical Records ──────────────────────────────────────────────────────────
create table public.medical_records (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics(id) on delete cascade,
  patient_id   uuid not null references public.patients(id) on delete cascade,
  uploaded_by  text not null check (uploaded_by in ('patient', 'admin')),
  category     text not null default 'document'
               check (category in ('lab_result', 'imaging', 'insurance', 'visit_summary', 'other')),
  name         text not null,
  file_path    text not null,   -- path in Supabase Storage bucket "medical-records"
  file_size    int,
  mime_type    text,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table public.medical_records enable row level security;

create policy "records: own patient read" on public.medical_records
  for select using (
    patient_id in (
      select id from public.patients where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

create policy "records: service role" on public.medical_records
  for all using (auth.role() = 'service_role');

create index records_patient_idx on public.medical_records (patient_id, created_at desc);

-- ─── Supabase Storage bucket ──────────────────────────────────────────────────
-- Run this to create the private bucket (service role only access via signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-records',
  'medical-records',
  false,
  10485760,   -- 10 MB per file
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage RLS: service role manages all objects
create policy "storage: service role" on storage.objects
  for all to authenticated
  using (bucket_id = 'medical-records' and auth.role() = 'service_role');
