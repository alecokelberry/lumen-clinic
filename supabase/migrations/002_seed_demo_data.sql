-- ─── Demo seed data for Lumen Clinic ─────────────────────────────────────────
-- Run after 001_initial_schema.sql
-- Uses fixed UUIDs so the frontend can reference them directly.

DO $$
DECLARE
  clinic_uuid UUID;
BEGIN
  SELECT id INTO clinic_uuid FROM public.clinics WHERE slug = 'lumen';

  -- ── Location ──────────────────────────────────────────────────────────────
  INSERT INTO public.locations (id, clinic_id, name, address, phone, timezone, lat, lng, hours)
  VALUES (
    '30000000-0000-0000-0000-000000000001',
    clinic_uuid,
    'Lumen Clinic — Main',
    '1234 Health Blvd, Suite 200, Salt Lake City, UT 84101',
    '(801) 555-0100',
    'America/Denver',
    40.7608,
    -111.8910,
    '{"mon":"8:00 AM–5:00 PM","tue":"8:00 AM–5:00 PM","wed":"8:00 AM–5:00 PM","thu":"8:00 AM–5:00 PM","fri":"8:00 AM–4:00 PM"}'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── Services ──────────────────────────────────────────────────────────────
  INSERT INTO public.services (id, clinic_id, name, description, duration_min, is_virtual, sort_order)
  VALUES
    ('10000000-0000-0000-0000-000000000001', clinic_uuid, 'New Patient Visit',       'First-time comprehensive evaluation.',            60, false, 1),
    ('10000000-0000-0000-0000-000000000002', clinic_uuid, 'Follow-Up Visit',          'Routine check-in for existing patients.',          30, false, 2),
    ('10000000-0000-0000-0000-000000000003', clinic_uuid, 'Telehealth Consultation',  'Video visit from anywhere.',                       30, true,  3),
    ('10000000-0000-0000-0000-000000000004', clinic_uuid, 'Allergy Testing',          'Full allergy panel with same-day results.',        90, false, 4),
    ('10000000-0000-0000-0000-000000000005', clinic_uuid, 'Hearing Evaluation',       'Complete audiological assessment.',                45, false, 5),
    ('10000000-0000-0000-0000-000000000006', clinic_uuid, 'Prescription Refill',      'Quick telehealth medication renewal.',             15, true,  6)
  ON CONFLICT (id) DO NOTHING;

  -- ── Providers ─────────────────────────────────────────────────────────────
  INSERT INTO public.providers (id, clinic_id, name, title, bio, specialties)
  VALUES
    ('20000000-0000-0000-0000-000000000001', clinic_uuid,
      'Dr. Sarah Chen', 'Otolaryngologist, MD',
      'Dr. Chen specializes in sinus and nasal disorders, bringing 12 years of experience and a patient-first approach to every visit.',
      ARRAY['Sinus & Nasal', 'Allergy']),
    ('20000000-0000-0000-0000-000000000002', clinic_uuid,
      'Dr. Marcus Webb', 'Pediatric Otolaryngologist, MD',
      'Dr. Webb is passionate about children''s ear, nose, and throat health, and is known for making kids feel at ease.',
      ARRAY['Pediatric ENT', 'Ear & Hearing']),
    ('20000000-0000-0000-0000-000000000003', clinic_uuid,
      'Dr. Priya Nair', 'Audiologist, AuD',
      'Dr. Nair is a leading audiologist specializing in hearing loss and tinnitus management with a compassionate, evidence-based approach.',
      ARRAY['Hearing Loss', 'Tinnitus']),
    ('20000000-0000-0000-0000-000000000004', clinic_uuid,
      'Dr. James Okafor', 'Otolaryngologist, MD',
      'Dr. Okafor focuses on sleep and snoring disorders as well as voice conditions, helping patients reclaim restful nights.',
      ARRAY['Sleep & Snoring', 'Voice'])
  ON CONFLICT (id) DO NOTHING;

  -- ── Provider Schedules (Mon–Fri, 9 AM–5 PM, 30-min slots) ─────────────────
  INSERT INTO public.provider_schedules (provider_id, location_id, day_of_week, start_time, end_time, slot_duration_min)
  SELECT p.id, '30000000-0000-0000-0000-000000000001', d.dow, '09:00', '17:00', 30
  FROM public.providers p
  CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(dow)
  WHERE p.clinic_id = clinic_uuid
  ON CONFLICT DO NOTHING;

END $$;
