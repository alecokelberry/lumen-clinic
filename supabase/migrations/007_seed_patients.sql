-- ─── Mock patient seed data for Lumen Clinic ─────────────────────────────────
-- Run after 001–006 migrations.
-- Uses obviously fake names/emails. clerk_user_id values are placeholder strings
-- (not real Clerk IDs) — service role bypasses RLS so they seed fine.
-- Appointment times are relative to now() so data stays fresh on any run date.

DO $$
DECLARE
  clinic_uuid  UUID;
  loc_uuid     UUID := '30000000-0000-0000-0000-000000000001';

  -- Provider UUIDs (from 002_seed_demo_data)
  p_chen       UUID := '20000000-0000-0000-0000-000000000001';
  p_webb       UUID := '20000000-0000-0000-0000-000000000002';
  p_nair       UUID := '20000000-0000-0000-0000-000000000003';
  p_okafor     UUID := '20000000-0000-0000-0000-000000000004';

  -- Service UUIDs (from 002_seed_demo_data)
  s_new        UUID := '10000000-0000-0000-0000-000000000001';
  s_followup   UUID := '10000000-0000-0000-0000-000000000002';
  s_tele       UUID := '10000000-0000-0000-0000-000000000003';
  s_allergy    UUID := '10000000-0000-0000-0000-000000000004';
  s_hearing    UUID := '10000000-0000-0000-0000-000000000005';
  s_rx         UUID := '10000000-0000-0000-0000-000000000006';

  -- Patient UUIDs (fixed so idempotent)
  pat1 UUID := 'a1000000-0000-0000-0000-000000000001';
  pat2 UUID := 'a1000000-0000-0000-0000-000000000002';
  pat3 UUID := 'a1000000-0000-0000-0000-000000000003';
  pat4 UUID := 'a1000000-0000-0000-0000-000000000004';
  pat5 UUID := 'a1000000-0000-0000-0000-000000000005';
  pat6 UUID := 'a1000000-0000-0000-0000-000000000006';

BEGIN
  SELECT id INTO clinic_uuid FROM public.clinics WHERE slug = 'lumen';

  -- ── Patients ──────────────────────────────────────────────────────────────
  INSERT INTO public.patients (id, clinic_id, clerk_user_id, first_name, last_name, dob, phone, email, insurance)
  VALUES
    (pat1, clinic_uuid, 'mock_user_001', 'Jane',    'Demo',     '1985-03-12', '(801) 555-0101', 'jane.demo@example.com',
      '{"provider":"Blue Cross Blue Shield","member_id":"BCB-100001","group_id":"GRP-5001"}'),
    (pat2, clinic_uuid, 'mock_user_002', 'Carlos',  'Test',     '1990-07-24', '(801) 555-0102', 'carlos.test@example.com',
      '{"provider":"Aetna","member_id":"AET-200002","group_id":"GRP-5002"}'),
    (pat3, clinic_uuid, 'mock_user_003', 'Priya',   'Sample',   '1978-11-05', '(801) 555-0103', 'priya.sample@example.com',
      '{"provider":"UnitedHealthcare","member_id":"UHC-300003","group_id":"GRP-5003"}'),
    (pat4, clinic_uuid, 'mock_user_004', 'Marcus',  'Fake',     '2001-02-18', '(801) 555-0104', 'marcus.fake@example.com',
      NULL),
    (pat5, clinic_uuid, 'mock_user_005', 'Olivia',  'Placeholder', '1968-09-30', '(801) 555-0105', 'olivia.placeholder@example.com',
      '{"provider":"Cigna","member_id":"CIG-500005","group_id":"GRP-5005"}'),
    (pat6, clinic_uuid, 'mock_user_006', 'Devon',   'Example',  '1995-06-14', '(801) 555-0106', 'devon.example@example.com',
      '{"provider":"Humana","member_id":"HUM-600006","group_id":"GRP-5006"}')
  ON CONFLICT (id) DO NOTHING;

  -- ── Appointments ──────────────────────────────────────────────────────────
  -- Past / completed
  INSERT INTO public.appointments
    (clinic_id, patient_id, provider_id, location_id, service_id, start_at, end_at, status, reason, intake_answers, confirmation_code, guest_name, guest_email)
  VALUES
    -- Jane: completed new patient visit (3 weeks ago)
    (clinic_uuid, pat1, p_chen, loc_uuid, s_new,
      now() - interval '21 days' + interval '10 hours',
      now() - interval '21 days' + interval '11 hours',
      'completed', 'Chronic sinus pressure and congestion',
      '{"chief_complaint":"Sinus pressure for 6 weeks","allergies":"Penicillin","medications":"None","insurance_verified":true}',
      'DEMO0001', NULL, NULL),

    -- Carlos: completed follow-up (1 week ago)
    (clinic_uuid, pat2, p_chen, loc_uuid, s_followup,
      now() - interval '7 days' + interval '14 hours',
      now() - interval '7 days' + interval '14 hours 30 minutes',
      'completed', 'Follow-up on allergy medication',
      '{"chief_complaint":"Checking in on Flonase","allergies":"Sulfa drugs","medications":"Flonase 50mcg","insurance_verified":true}',
      'DEMO0002', NULL, NULL),

    -- Priya: completed hearing evaluation (2 weeks ago)
    (clinic_uuid, pat3, p_nair, loc_uuid, s_hearing,
      now() - interval '14 days' + interval '9 hours',
      now() - interval '14 days' + interval '9 hours 45 minutes',
      'completed', 'Difficulty hearing in left ear',
      '{"chief_complaint":"Hearing loss left ear 3 months","allergies":"None","medications":"None","insurance_verified":true}',
      'DEMO0003', NULL, NULL),

    -- Marcus: cancelled (last week)
    (clinic_uuid, pat4, p_webb, loc_uuid, s_new,
      now() - interval '5 days' + interval '11 hours',
      now() - interval '5 days' + interval '12 hours',
      'cancelled', 'New patient evaluation', NULL,
      'DEMO0004', NULL, NULL),

    -- Guest booking (no patient_id): completed telehealth (10 days ago)
    (clinic_uuid, NULL, p_okafor, loc_uuid, s_tele,
      now() - interval '10 days' + interval '15 hours',
      now() - interval '10 days' + interval '15 hours 30 minutes',
      'completed', 'Snoring and sleep disruption', NULL,
      'DEMO0005', 'Alex Guest', 'alex.guest@example.com'),

  -- Upcoming / scheduled
    -- Jane: upcoming follow-up (tomorrow at 10 AM)
    (clinic_uuid, pat1, p_chen, loc_uuid, s_followup,
      date_trunc('day', now()) + interval '1 day' + interval '10 hours',
      date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes',
      'confirmed', 'Post-treatment check', NULL,
      'DEMO0006', NULL, NULL),

    -- Olivia: upcoming allergy testing (3 days out, 9 AM)
    (clinic_uuid, pat5, p_chen, loc_uuid, s_allergy,
      date_trunc('day', now()) + interval '3 days' + interval '9 hours',
      date_trunc('day', now()) + interval '3 days' + interval '10 hours 30 minutes',
      'scheduled', 'Full allergy panel', NULL,
      'DEMO0007', NULL, NULL),

    -- Devon: upcoming telehealth prescription refill (5 days out, 2 PM)
    (clinic_uuid, pat6, p_nair, loc_uuid, s_rx,
      date_trunc('day', now()) + interval '5 days' + interval '14 hours',
      date_trunc('day', now()) + interval '5 days' + interval '14 hours 15 minutes',
      'scheduled', 'Refill hearing aid prescription', NULL,
      'DEMO0008', NULL, NULL),

    -- Carlos: no-show (yesterday)
    (clinic_uuid, pat2, p_okafor, loc_uuid, s_tele,
      date_trunc('day', now()) - interval '1 day' + interval '13 hours',
      date_trunc('day', now()) - interval '1 day' + interval '13 hours 30 minutes',
      'no-show', 'Telehealth for voice hoarseness', NULL,
      'DEMO0009', NULL, NULL)
  ON CONFLICT DO NOTHING;

  -- ── Messages ──────────────────────────────────────────────────────────────
  -- Jane ↔ admin thread (read by admin)
  INSERT INTO public.messages (clinic_id, patient_id, sender_role, body, read_at, created_at)
  VALUES
    (clinic_uuid, pat1, 'patient', 'Hi, I wanted to check if my insurance is accepted before my upcoming visit.',
      now() - interval '2 days', now() - interval '3 days'),
    (clinic_uuid, pat1, 'admin',   'Hi Jane! Yes, Blue Cross Blue Shield is in-network with us. See you soon.',
      now() - interval '2 days', now() - interval '2 days 12 hours'),
    (clinic_uuid, pat1, 'patient', 'Perfect, thank you so much!',
      now() - interval '1 day', now() - interval '2 days');

  -- Priya thread (unread admin message)
  INSERT INTO public.messages (clinic_id, patient_id, sender_role, body, read_at, created_at)
  VALUES
    (clinic_uuid, pat3, 'patient', 'Do you have my audiogram results available yet?',
      now() - interval '6 hours', now() - interval '1 day'),
    (clinic_uuid, pat3, 'admin',   'Hi Priya! Your results are ready. We''ll send a summary by end of day.',
      NULL, now() - interval '4 hours');

  -- Devon thread (new unread message from patient)
  INSERT INTO public.messages (clinic_id, patient_id, sender_role, body, read_at, created_at)
  VALUES
    (clinic_uuid, pat6, 'patient', 'Quick question — can I take my current medication the morning of my telehealth appointment?',
      NULL, now() - interval '30 minutes');

  -- ── Medical Records ───────────────────────────────────────────────────────
  -- dummy file_path values (no actual Storage object needed for UI to render)
  INSERT INTO public.medical_records (clinic_id, patient_id, uploaded_by, category, name, file_path, file_size, mime_type, notes, created_at)
  VALUES
    (clinic_uuid, pat1, 'admin',   'visit_summary', 'New Patient Visit Summary — 2026-02-21',
      'lumen/pat1/visit_summary_2026-02-21.pdf', 142000, 'application/pdf',
      'Dr. Chen post-visit notes', now() - interval '21 days'),
    (clinic_uuid, pat1, 'patient', 'insurance',     'BCBS Insurance Card',
      'lumen/pat1/insurance_card.jpg', 88000, 'image/jpeg',
      NULL, now() - interval '25 days'),
    (clinic_uuid, pat3, 'admin',   'lab_result',    'Audiogram — 2026-02-28',
      'lumen/pat3/audiogram_2026-02-28.pdf', 210000, 'application/pdf',
      'Pure-tone audiometry results', now() - interval '14 days'),
    (clinic_uuid, pat3, 'patient', 'other',         'Previous Hearing Aid Prescription',
      'lumen/pat3/rx_hearing_aid_2025.pdf', 65000, 'application/pdf',
      NULL, now() - interval '15 days'),
    (clinic_uuid, pat5, 'patient', 'insurance',     'Cigna Member Card',
      'lumen/pat5/cigna_card.png', 95000, 'image/png',
      NULL, now() - interval '2 days'),
    (clinic_uuid, pat2, 'admin',   'visit_summary', 'Follow-Up Visit Summary — 2026-03-07',
      'lumen/pat2/visit_summary_2026-03-07.pdf', 130000, 'application/pdf',
      'Flonase efficacy noted, continue course', now() - interval '7 days')
  ON CONFLICT DO NOTHING;

END $$;
