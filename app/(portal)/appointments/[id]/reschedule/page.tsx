import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { redirect, notFound } from "next/navigation"
import { RescheduleWidget } from "./reschedule-widget"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Reschedule Appointment" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Auth guard
  let clerkUserId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")
    clerkUserId = userId
  }

  // Fetch the appointment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, start_at, end_at, status, provider_id, service_id, providers(name), services(name, duration_min)")
    .eq("id", id)
    .eq("clinic_id", clinic.id)
    .single()

  if (!appt) notFound()

  type ApptRow = {
    id: string
    start_at: string
    status: string
    provider_id: string
    service_id: string
    providers: { name: string } | null
    services: { name: string; duration_min: number } | null
  }

  const row = appt as ApptRow

  // Only allow reschedule of future, non-cancelled/completed appointments
  const isCancellable = !["cancelled", "completed", "no-show"].includes(row.status)
  const isFuture = new Date(row.start_at) > new Date()
  if (!isCancellable || !isFuture) redirect("/appointments")

  // Verify the patient owns this appointment (if logged in)
  if (clerkUserId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("clerk_user_id", clerkUserId)
      .single()

    const patientId = (patient as { id: string } | null)?.id
    if (patientId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ownership } = await supabase
        .from("appointments")
        .select("id")
        .eq("id", id)
        .eq("patient_id", patientId)
        .single()
      if (!ownership) redirect("/appointments")
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reschedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a new date and time for your {row.services?.name ?? "appointment"} with{" "}
          {row.providers?.name ?? "your provider"}.
        </p>
      </div>

      <RescheduleWidget
        appointmentId={id}
        providerId={row.provider_id}
        clinicId={clinic.id}
        durationMin={row.services?.duration_min ?? 30}
      />
    </div>
  )
}
