"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface IntakeAnswers {
  reason: string
  medications: string
  allergies: string
  medical_history: string
  emergency_contact_name: string
  emergency_contact_phone: string
  insurance_carrier: string
  insurance_member_id: string
}

export async function saveIntakeForm(
  appointmentId: string,
  answers: IntakeAnswers
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("appointments")
    .update({ intake_answers: answers as unknown as Record<string, string> })
    .eq("id", appointmentId)

  if (error) return { error: error.message }

  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  revalidatePath("/admin")
  return {}
}
