"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { revalidatePath } from "next/cache"

export interface ProviderInput {
  id?: string
  name: string
  title: string
  bio: string
  npi: string
  specialties: string[]
  is_active: boolean
}

export async function saveProvider(
  input: ProviderInput
): Promise<{ error?: string; id?: string }> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const fields = {
    name: input.name.trim(),
    title: input.title.trim() || null,
    bio: input.bio.trim() || null,
    npi: input.npi.trim() || null,
    specialties: input.specialties.filter(Boolean),
    is_active: input.is_active,
  }

  if (input.id) {
    const { error } = await supabase
      .from("providers")
      .update(fields)
      .eq("id", input.id)
      .eq("clinic_id", clinic.id)

    if (error) return { error: error.message }
    revalidatePath("/admin/providers")
    revalidatePath("/providers")
    return { id: input.id }
  }

  const { data, error } = await supabase
    .from("providers")
    .insert({ clinic_id: clinic.id, ...fields })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/admin/providers")
  revalidatePath("/providers")
  return { id: (data as { id: string }).id }
}
