import { headers } from "next/headers"
import { cache } from "react"
import type { Clinic } from "@/lib/supabase/types"
import { createServiceClient } from "@/lib/supabase/server"

const FALLBACK_CLINIC: Clinic = {
  id: "demo-clinic-id",
  slug: "lumen",
  custom_domain: null,
  name: "Lumen Clinic",
  tagline: "Compassionate care — close to home.",
  logo_url: null,
  hero_image_url: null,
  primary_color: "#2563eb",
  accent_color: "#eff6ff",
  theme: {},
  settings: {
    nav: ["Services", "Providers", "Locations", "About"],
    features: { telehealth: true, guestBooking: true },
  },
  timezone: "America/New_York",
  created_at: new Date().toISOString(),
}

/**
 * Resolves the current clinic from the x-clinic-slug request header.
 * Cached per-request via React cache() so it only runs once per RSC tree.
 */
export const getClinic = cache(async (): Promise<Clinic> => {
  const headersList = await headers()
  const slug = headersList.get("x-clinic-slug") ?? "lumen"

  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from("clinics")
      .select("*")
      .or(`slug.eq.${slug},custom_domain.eq.${slug}`)
      .single()
    return (data as Clinic | null) ?? FALLBACK_CLINIC
  } catch {
    // Supabase not configured or unreachable — use fallback clinic
    return FALLBACK_CLINIC
  }
})
