"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { revalidatePath } from "next/cache"
import { sendRescheduleConfirmation } from "@/lib/email"
import { clinicLocalToUTC, formatDateInTz, formatTimeInTz } from "@/lib/tz"

export async function cancelAppointment(appointmentId: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
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
  const { error } = await supabase
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
  const [clinic, supabase] = await Promise.all([getClinic(), createServiceClient()])

  // Fetch the full appointment for duration + email
  const { data: appt } = await supabase
    .from("appointments")
    .select(`
      confirmation_code, guest_name, guest_email, is_virtual,
      services(name, duration_min),
      providers(name),
      locations(name),
      patients(email, first_name, last_name)
    `)
    .eq("id", appointmentId)
    .single()

  type ApptRow = {
    confirmation_code: string
    guest_name: string | null
    guest_email: string | null
    is_virtual: boolean
    services: { name: string; duration_min: number } | null
    providers: { name: string } | null
    locations: { name: string } | null
    patients: { email: string; first_name: string; last_name: string } | null
  }
  const a = appt as ApptRow | null
  const durationMin = a?.services?.duration_min ?? 30

  // Parse time string "9:00 AM" → hours + minutes
  const [timePart, period] = newTime.split(" ")
  const [h, m] = timePart.split(":").map(Number)
  let hours = h
  if (period === "PM" && h !== 12) hours = h + 12
  if (period === "AM" && h === 12) hours = 0
  const hhmm = `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`

  const startAt = clinicLocalToUTC(newDate, hhmm, clinic.timezone)
  const endAt = new Date(startAt.getTime() + durationMin * 60_000)

  const { error } = await supabase
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

  // Send reschedule confirmation email (fire-and-forget)
  if (a) {
    const recipientEmail = a.guest_email ?? a.patients?.email
    const recipientName = a.guest_name ?? (a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : null)
    if (recipientEmail && recipientName) {
      sendRescheduleConfirmation({
        to: recipientEmail,
        guestName: recipientName,
        clinicName: clinic.name,
        confirmationCode: a.confirmation_code,
        serviceName: a.services?.name ?? "Appointment",
        providerName: a.providers?.name ?? clinic.name,
        date: formatDateInTz(startAt.toISOString(), clinic.timezone),
        time: formatTimeInTz(startAt.toISOString(), clinic.timezone),
        isVirtual: a.is_virtual,
        locationName: a.locations?.name,
      }).catch(() => {})
    }
  }

  return {}
}
