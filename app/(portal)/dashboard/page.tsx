import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Button } from "@/components/ui/button"
import { CalendarDays, MessageSquare, FileText, CreditCard, Clock, MapPin, Video, Plus, ArrowRight, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}
function formatApptTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: "Confirmed", bg: "#f0fdf4", color: "#15803d" },
  scheduled: { label: "Scheduled", bg: "#eff6ff", color: "#1d4ed8" },
  completed: { label: "Completed", bg: "#f8fafc", color: "#64748b" },
  cancelled: { label: "Cancelled", bg: "#fef2f2", color: "#dc2626" },
  "no-show": { label: "No show",   bg: "#fff7ed", color: "#c2410c" },
}

const QUICK_ACTIONS = [
  { label: "Book Appointment", href: "/book",     icon: CalendarDays, bg: "#eff6ff", color: "#2563eb" },
  { label: "Messages",         href: "/messages", icon: MessageSquare, bg: "#f0fdf4", color: "#16a34a" },
  { label: "Medical Records",  href: "/records",  icon: FileText,      bg: "#faf5ff", color: "#7c3aed" },
  { label: "Billing",          href: "/billing",  icon: CreditCard,    bg: "#fffbeb", color: "#d97706" },
]

export default async function DashboardPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  let clerkUserId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    clerkUserId = userId
  }

  let appointments: Array<{
    id: string; start_at: string; status: string; is_virtual: boolean
    providers: { name: string } | null
    services: { name: string } | null
    locations: { name: string } | null
  }> = []

  if (clerkUserId) {
    const { data: patient } = await supabase.from("patients").select("id").eq("clinic_id", clinic.id).eq("clerk_user_id", clerkUserId).single()
    const patientId = (patient as { id: string } | null)?.id
    if (patientId) {
      const { data } = await supabase
        .from("appointments")
        .select("id, start_at, status, is_virtual, providers(name), services(name), locations(name)")
        .eq("patient_id", patientId)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5)
      appointments = (data ?? []) as typeof appointments
    }
  }

  let firstName = "there"
  if (clerkConfigured && clerkUserId) {
    try {
      const { currentUser } = await import("@clerk/nextjs/server")
      const user = await currentUser()
      if (user?.firstName) firstName = user.firstName
    } catch { /* Clerk not fully configured */ }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="font-bold text-slate-900" style={{ fontSize: "1.375rem", letterSpacing: "-0.02em" }}>
          Good morning, {firstName}
        </h1>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition-all hover:shadow-sm"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: action.bg }}>
              <action.icon className="h-4 w-4" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium leading-tight text-slate-700">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming appointments</h2>
          <Button asChild size="sm" className="h-8 px-3 text-xs text-white hover:opacity-90" style={{ background: "var(--clinic-primary)" }}>
            <Link href="/book">
              <Plus className="mr-1 h-3 w-3" />
              Book new
            </Link>
          </Button>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-white py-10 text-center" style={{ borderColor: "#e2e8f0" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#f8fafc" }}>
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No upcoming appointments</p>
              <p className="mt-0.5 text-sm text-slate-500">Book your next visit in under a minute.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {appointments.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled
                return (
                  <Link
                    key={appt.id}
                    href="/appointments"
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 group"
                  >
                    {/* Date block */}
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: "#eff6ff" }}>
                      <span className="text-xs font-semibold uppercase leading-none" style={{ color: "var(--clinic-primary)" }}>
                        {new Date(appt.start_at).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-none" style={{ color: "var(--clinic-primary)" }}>
                        {new Date(appt.start_at).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {appt.services?.name ?? "Appointment"}
                        </p>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatApptDate(appt.start_at)} · {formatApptTime(appt.start_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          {appt.is_virtual
                            ? <><Video className="h-3 w-3" /> Telehealth</>
                            : <><MapPin className="h-3 w-3" /> {appt.locations?.name}</>
                          }
                        </span>
                      </div>
                      {appt.providers?.name && (
                        <p className="mt-0.5 text-xs text-slate-400">{appt.providers.name}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>

            <Link
              href="/appointments"
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-slate-50"
              style={{ borderTop: "1px solid #f1f5f9", color: "var(--clinic-primary)" }}
            >
              View all appointments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
