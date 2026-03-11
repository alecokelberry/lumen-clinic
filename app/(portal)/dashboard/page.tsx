import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MessageSquare, FileText, CreditCard, Clock, MapPin, Video, Plus } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatApptTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

const QUICK_ACTIONS = [
  { label: "Book Appointment", href: "/book", icon: CalendarDays, color: "text-[var(--clinic-primary)]" },
  { label: "Messages", href: "/messages", icon: MessageSquare, color: "text-emerald-600" },
  { label: "Medical Records", href: "/records", icon: FileText, color: "text-violet-600" },
  { label: "Pay My Bill", href: "/billing", icon: CreditCard, color: "text-amber-600" },
]

export default async function DashboardPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Get current user's clerk ID if Clerk is configured
  let clerkUserId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    clerkUserId = userId
  }

  // Fetch upcoming appointments for this patient
  let appointments: Array<{
    id: string
    start_at: string
    status: string
    is_virtual: boolean
    providers: { name: string } | null
    services: { name: string } | null
    locations: { name: string } | null
  }> = []

  if (clerkUserId) {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("clerk_user_id", clerkUserId)
      .single()

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

  // First name from Clerk if available, fallback to "there"
  let firstName = "there"
  if (clerkConfigured && clerkUserId) {
    try {
      const { currentUser } = await import("@clerk/nextjs/server")
      const user = await currentUser()
      if (user?.firstName) firstName = user.firstName
    } catch {
      // Clerk not fully configured
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hey, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to your {clinic.name} portal.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full cursor-pointer border border-border/60 transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Upcoming appointments</h2>
          <Button asChild size="sm" className="bg-[var(--clinic-primary)] text-white hover:opacity-90">
            <Link href="/book">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Book new
            </Link>
          </Button>
        </div>

        {appointments.length === 0 ? (
          <Card className="border border-dashed border-border/60">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-foreground">No upcoming appointments</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Book your next visit in under 60 seconds.
                </p>
              </div>
              <Button asChild size="sm" className="mt-1 bg-[var(--clinic-primary)] text-white hover:opacity-90">
                <Link href="/book">Book appointment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <Card key={appt.id} className="border border-border/60">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--clinic-accent)] text-[var(--clinic-primary)]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {appt.services?.name ?? "Appointment"}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
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
                      <p className="mt-0.5 text-xs text-muted-foreground">{appt.providers.name}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 capitalize">
                    {appt.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
