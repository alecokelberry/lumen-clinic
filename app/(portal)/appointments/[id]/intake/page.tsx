import { notFound, redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { IntakeForm } from "./intake-form"
import type { Metadata } from "next"
import type { IntakeAnswers } from "@/lib/actions/intake"

export const metadata: Metadata = { title: "Intake Form" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

type Props = { params: Promise<{ id: string }> }

export default async function IntakePage({ params }: Props) {
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

  // Fetch appointment + verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, status, reason, intake_answers, patient_id, providers(name), services(name), start_at")
    .eq("id", id)
    .eq("clinic_id", clinic.id)
    .single()

  if (!appt) notFound()

  type ApptRow = {
    id: string
    status: string
    reason: string | null
    intake_answers: IntakeAnswers | null
    patient_id: string | null
    start_at: string
    providers: { name: string } | null
    services: { name: string } | null
  }

  const row = appt as ApptRow

  // Only allow future, non-cancelled appointments
  if (["cancelled", "completed", "no-show"].includes(row.status)) redirect("/appointments")

  // Verify ownership
  if (clerkUserId && row.patient_id) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("clerk_user_id", clerkUserId)
      .single()
    const patientId = (patient as { id: string } | null)?.id
    if (patientId && patientId !== row.patient_id) redirect("/appointments")
  }

  const apptDate = new Date(row.start_at).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Intake Form</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {row.services?.name} with {row.providers?.name} · {apptDate}
        </p>
        {row.intake_answers && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            Previously submitted — you can update below.
          </p>
        )}
      </div>

      <IntakeForm
        appointmentId={id}
        prefillReason={row.reason ?? ""}
        existing={row.intake_answers}
      />
    </div>
  )
}
