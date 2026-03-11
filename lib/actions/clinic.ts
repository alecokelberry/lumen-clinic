"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { revalidatePath } from "next/cache"

export interface ClinicSettingsInput {
  name: string
  tagline: string
  primary_color: string
  accent_color: string
  timezone: string
}

export async function updateClinicSettings(
  input: ClinicSettingsInput
): Promise<{ error?: string }> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("clinics")
    .update({
      name: input.name.trim(),
      tagline: input.tagline.trim() || null,
      primary_color: input.primary_color,
      accent_color: input.accent_color,
      timezone: input.timezone,
    })
    .eq("id", clinic.id)

  if (error) return { error: error.message }

  revalidatePath("/", "layout")
  revalidatePath("/admin", "layout")
  return {}
}
