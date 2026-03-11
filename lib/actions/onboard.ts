"use server"

import { createServiceClient } from "@/lib/supabase/server"

export interface OnboardInput {
  // Step 1 — Clinic identity
  name: string
  slug: string
  tagline: string
  email: string
  phone: string
  // Step 2 — Branding
  primary_color: string
  accent_color: string
  // Step 3 — Location
  address: string
  city: string
  state: string
  zip: string
  timezone: string
  hours: { day: string; open: string; close: string; closed: boolean }[]
  // Step 4 — Services
  services: { name: string; duration_min: number; is_virtual: boolean; price_cents: number | null }[]
}

export async function createClinic(input: OnboardInput): Promise<{ error?: string; slug?: string }> {
  const supabase = await createServiceClient()

  // Validate slug uniqueness
  const safeSlug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await supabase
    .from("clinics").select("id").eq("slug", safeSlug).single()
  if (existing) return { error: `The URL "${safeSlug}" is already taken. Choose another.` }

  // Build hours JSON
  const hoursObj: Record<string, { open: string; close: string } | null> = {}
  for (const h of input.hours) {
    hoursObj[h.day] = h.closed ? null : { open: h.open, close: h.close }
  }

  // 1. Create clinic
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({
      slug: safeSlug,
      name: input.name.trim(),
      tagline: input.tagline.trim() || null,
      primary_color: input.primary_color,
      accent_color: input.accent_color,
      timezone: input.timezone || "America/New_York",
      settings: {
        contact: { email: input.email.trim(), phone: input.phone.trim() },
        features: { telehealth: true, guestBooking: true },
      },
    })
    .select("id")
    .single()

  if (clinicError) return { error: clinicError.message }
  const clinicId = (clinic as { id: string }).id

  // 2. Create location
  await supabase
    .from("locations")
    .insert({
      clinic_id: clinicId,
      name: `${input.name} — ${input.city}`,
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      zip: input.zip.trim(),
      phone: input.phone.trim() || null,
      timezone: input.timezone || "America/New_York",
      hours: hoursObj as Record<string, { open: string; close: string } | null>,
    })

  // 3. Create services
  if (input.services.length > 0) {
    await supabase
      .from("services")
      .insert(
        input.services.map((s, i) => ({
          clinic_id: clinicId,
          name: s.name.trim(),
          duration_min: s.duration_min,
          is_virtual: s.is_virtual,
          price_cents: s.price_cents,
          sort_order: i,
          is_active: true,
        }))
      )
  }

  return { slug: safeSlug }
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const supabase = await createServiceClient()
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.from("clinics").select("id").eq("slug", safe).single()
  return !data
}
