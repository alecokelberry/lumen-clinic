"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { revalidatePath } from "next/cache"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export async function sendPatientMessage(body: string): Promise<{ error?: string }> {
  if (!body.trim()) return { error: "Message cannot be empty." }

  const clinic = await getClinic()
  const supabase = await createServiceClient()

  let patientId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) return { error: "Not authenticated." }

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("clerk_user_id", userId)
      .single()
    patientId = (patient as { id: string } | null)?.id ?? null
  }

  if (!patientId) return { error: "Patient record not found. Please book an appointment first." }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("messages")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      sender_role: "patient",
      body: body.trim(),
    })

  if (error) return { error: error.message }

  revalidatePath("/messages")
  revalidatePath("/admin/messages")
  return {}
}

export async function sendAdminMessage(
  patientId: string,
  body: string
): Promise<{ error?: string }> {
  if (!body.trim()) return { error: "Message cannot be empty." }

  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("messages")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      sender_role: "admin",
      body: body.trim(),
    })

  if (error) return { error: error.message }

  revalidatePath("/admin/messages")
  revalidatePath("/messages")
  return {}
}

export async function markThreadRead(patientId: string): Promise<void> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("clinic_id", clinic.id)
    .eq("patient_id", patientId)
    .eq("sender_role", "patient")
    .is("read_at", null)

  revalidatePath("/admin/messages")
}
