import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, MapPin, Video, Plus, RotateCcw, ClipboardList } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { CancelButton } from "./cancel-button"

export const metadata: Metadata = { title: "Appointments" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

type Appt = {
  id: string
  start_at: string
  end_at: string
  status: string
  is_virtual: boolean
  confirmation_code: string
  reason: string | null
  intake_answers: Record<string, string> | null
  providers: { name: string } | null
  services: { name: string } | null
  locations: { name: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-600",
  "no-show": "bg-orange-100 text-orange-700",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export default async function AppointmentsPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  let clerkUserId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    clerkUserId = userId
  }

  let upcoming: Appt[] = []
  let past: Appt[] = []

  if (clerkUserId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("clerk_user_id", clerkUserId)
      .single()

    const patientId = (patient as { id: string } | null)?.id

    if (patientId) {
      const now = new Date().toISOString()

      const { data: upcomingData } = await supabase
        .from("appointments")
        .select("id, start_at, end_at, status, is_virtual, confirmation_code, reason, intake_answers, providers(name), services(name), locations(name)")
        .eq("patient_id", patientId)
        .neq("status", "cancelled")
        .gte("start_at", now)
        .order("start_at", { ascending: true })

      const { data: pastData } = await supabase
        .from("appointments")
        .select("id, start_at, end_at, status, is_virtual, confirmation_code, reason, intake_answers, providers(name), services(name), locations(name)")
        .eq("patient_id", patientId)
        .lt("start_at", now)
        .order("start_at", { ascending: false })
        .limit(10)

      upcoming = (upcomingData ?? []) as Appt[]
      past = (pastData ?? []) as Appt[]
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your upcoming and past visits.</p>
        </div>
        <Button asChild className="bg-[var(--clinic-primary)] text-white hover:opacity-90">
          <Link href="/book">
            <Plus className="mr-1.5 h-4 w-4" />
            Book new
          </Link>
        </Button>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <Card className="border border-dashed border-border/60">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
              <Button asChild size="sm" className="bg-[var(--clinic-primary)] text-white hover:opacity-90">
                <Link href="/book">Book now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} allowCancel />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Past visits
          </h2>
          <div className="space-y-3">
            {past.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} allowCancel={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AppointmentCard({ appt, allowCancel }: { appt: Appt; allowCancel: boolean }) {
  const isCancellable = allowCancel && !["cancelled", "completed", "no-show"].includes(appt.status)

  return (
    <Card className="border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">
                {appt.services?.name ?? "Appointment"}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled}`}
              >
                {appt.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {formatDate(appt.start_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(appt.start_at)} – {formatTime(appt.end_at)}
              </span>
              <span className="flex items-center gap-1">
                {appt.is_virtual
                  ? <><Video className="h-3 w-3" /> Telehealth</>
                  : <><MapPin className="h-3 w-3" /> {appt.locations?.name}</>
                }
              </span>
            </div>

            {appt.providers?.name && (
              <p className="text-xs text-muted-foreground">{appt.providers.name}</p>
            )}

            {appt.reason && (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {appt.reason}
              </p>
            )}

            <p className="text-xs text-muted-foreground/60">
              Confirmation #{appt.confirmation_code}
            </p>
          </div>

          {/* Actions */}
          {isCancellable && (
            <div className="flex shrink-0 flex-col gap-2">
              {!appt.intake_answers && (
                <Button asChild size="sm" className="text-xs bg-[var(--clinic-primary)] text-white hover:opacity-90">
                  <Link href={`/appointments/${appt.id}/intake`}>
                    <ClipboardList className="mr-1.5 h-3 w-3" />
                    Intake form
                  </Link>
                </Button>
              )}
              {appt.intake_answers && (
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <Link href={`/appointments/${appt.id}/intake`}>
                    <ClipboardList className="mr-1.5 h-3 w-3" />
                    Edit intake
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href={`/appointments/${appt.id}/reschedule`}>
                  <RotateCcw className="mr-1.5 h-3 w-3" />
                  Reschedule
                </Link>
              </Button>
              <CancelButton appointmentId={appt.id} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
