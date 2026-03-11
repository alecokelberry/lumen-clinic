"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { sendBookingConfirmation } from "@/lib/email"
import { clinicLocalToUTC, formatDateInTz, formatTimeInTz } from "@/lib/tz"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export interface BookingInput {
  serviceId: string
  providerId: string | null
  locationId: string | null
  date: string        // "YYYY-MM-DD"
  time: string        // "9:00 AM"
  isVirtual: boolean
  guestName: string
  guestEmail: string
  guestPhone: string
  reason: string
}

export type BookingResult =
  | { confirmationCode: string; error?: never }
  | { error: string; confirmationCode?: never }

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [timePart, period] = timeStr.split(" ")
  const [h, m] = timePart.split(":").map(Number)
  let hours = h
  if (period === "PM" && h !== 12) hours = h + 12
  if (period === "AM" && h === 12) hours = 0
  return { hours, minutes: m }
}

export async function createAppointment(input: BookingInput): Promise<BookingResult> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Resolve provider — fall back to first active provider if "any" or null
  let providerId = input.providerId
  if (!providerId || providerId === "any") {
    const { data: p } = await supabase
      .from("providers")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .limit(1)
      .single()
    const row = p as { id: string } | null
    if (!row) return { error: "No providers available." }
    providerId = row.id
  }

  // Resolve location — fall back to first location
  let locationId = input.locationId
  if (!locationId) {
    const { data: l } = await supabase
      .from("locations")
      .select("id")
      .eq("clinic_id", clinic.id)
      .limit(1)
      .single()
    const row = l as { id: string } | null
    if (!row) return { error: "No locations available." }
    locationId = row.id
  }

  // Get service duration for end_at calculation
  const { data: service } = await supabase
    .from("services")
    .select("duration_min")
    .eq("id", input.serviceId)
    .single()
  const durationMin = (service as { duration_min: number } | null)?.duration_min ?? 30

  // Build UTC timestamps from clinic-local date + time strings
  const { hours, minutes } = parseTime(input.time)
  const localHHMM = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  const timezone = clinic.timezone ?? "UTC"
  const startAt = clinicLocalToUTC(input.date, localHHMM, timezone)
  const endAt = new Date(startAt.getTime() + durationMin * 60_000)

  // If user is logged in, upsert a patient record and link the appointment
  let patientId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (userId) {
      const nameParts = input.guestName.trim().split(" ")
      const firstName = nameParts[0] ?? ""
      const lastName = nameParts.slice(1).join(" ") || firstName

      const { data: patient } = await supabase
        .from("patients")
        .upsert(
          {
            clinic_id: clinic.id,
            clerk_user_id: userId,
            first_name: firstName,
            last_name: lastName,
            email: input.guestEmail,
            phone: input.guestPhone || null,
          },
          { onConflict: "clinic_id,clerk_user_id", ignoreDuplicates: false }
        )
        .select("id")
        .single()
      patientId = (patient as { id: string } | null)?.id ?? null
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      provider_id: providerId,
      location_id: locationId,
      service_id: input.serviceId,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: "scheduled",
      is_virtual: input.isVirtual,
      reason: input.reason || null,
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone || null,
    })
    .select("confirmation_code")
    .single()

  if (error) return { error: error.message }

  const confirmationCode: string = data.confirmation_code

  // Fire-and-forget confirmation email (non-blocking)
  if (input.guestEmail) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [{ data: svc }, { data: prov }, { data: loc }] = await Promise.all([
      supabase.from("services").select("name").eq("id", input.serviceId).single(),
      supabase.from("providers").select("name").eq("id", providerId).single(),
      supabase.from("locations").select("name").eq("id", locationId).single(),
    ])

    sendBookingConfirmation({
      to: input.guestEmail,
      guestName: input.guestName || "Patient",
      clinicName: clinic.name,
      confirmationCode,
      serviceName: (svc as { name: string } | null)?.name ?? "Appointment",
      providerName: (prov as { name: string } | null)?.name ?? "Provider",
      date: formatDateInTz(startAt.toISOString(), timezone),
      time: formatTimeInTz(startAt.toISOString(), timezone),
      isVirtual: input.isVirtual,
      locationName: (loc as { name: string } | null)?.name ?? undefined,
    }).catch((err) => console.error("[email] Failed to send confirmation:", err))
  }

  return { confirmationCode }
}
