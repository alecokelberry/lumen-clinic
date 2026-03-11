"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function cancelAppointment(appointmentId: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
  if (error) return { error: error.message }
  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  revalidatePath("/admin")
  return {}
}

export async function confirmAppointment(appointmentId: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("appointments")
    .update({ status: "confirmed" })
    .eq("id", appointmentId)
  if (error) return { error: error.message }
  revalidatePath("/admin")
  revalidatePath("/dashboard")
  return {}
}

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,   // "YYYY-MM-DD"
  newTime: string,   // "9:00 AM"
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()

  // Fetch the appointment to get service duration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appt } = await (supabase as any)
    .from("appointments")
    .select("service_id, services(duration_min)")
    .eq("id", appointmentId)
    .single()

  const durationMin = (appt as { services: { duration_min: number } } | null)?.services?.duration_min ?? 30

  // Parse time string "9:00 AM" → hours + minutes
  const [timePart, period] = newTime.split(" ")
  const [h, m] = timePart.split(":").map(Number)
  let hours = h
  if (period === "PM" && h !== 12) hours = h + 12
  if (period === "AM" && h === 12) hours = 0

  const startAt = new Date(
    `${newDate}T${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
  )
  const endAt = new Date(startAt.getTime() + durationMin * 60_000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("appointments")
    .update({
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: "scheduled",
    })
    .eq("id", appointmentId)

  if (error) return { error: error.message }
  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  revalidatePath("/admin")
  return {}
}
