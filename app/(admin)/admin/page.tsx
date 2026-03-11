import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, MapPin, Video, Users, TrendingUp, CheckCircle2 } from "lucide-react"
import { Suspense } from "react"
import { StatusFilter } from "@/components/admin/status-filter"
import { BookingRowActions } from "@/components/admin/booking-row-actions"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Bookings" }

type Booking = {
  id: string
  start_at: string
  end_at: string
  status: string
  is_virtual: boolean
  confirmation_code: string
  reason: string | null
  guest_name: string | null
  guest_email: string | null
  providers: { name: string } | null
  services: { name: string } | null
  locations: { name: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:  "bg-blue-100 text-blue-700 border-blue-200",
  confirmed:  "bg-green-100 text-green-700 border-green-200",
  completed:  "bg-muted text-muted-foreground border-border",
  cancelled:  "bg-red-100 text-red-600 border-red-200",
  "no-show":  "bg-orange-100 text-orange-700 border-orange-200",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function startOfDay(d = new Date()) {
  const r = new Date(d); r.setHours(0,0,0,0); return r
}
function startOfWeek(d = new Date()) {
  const r = new Date(d); r.setDate(r.getDate() - r.getDay()); r.setHours(0,0,0,0); return r
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // ── Stats ──────────────────────────────────────────────────────────────────
  const todayStart = startOfDay().toISOString()
  const weekStart = startOfWeek().toISOString()

  const [{ count: todayCount }, { count: weekCount }, { count: totalCount }, { count: patientCount }] =
    await Promise.all([
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id).neq("status", "cancelled").gte("start_at", todayStart),
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id).neq("status", "cancelled").gte("start_at", weekStart),
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id),
      supabase.from("patients").select("*", { count: "exact", head: true })
        .eq("clinic_id", clinic.id),
    ])

  const STATS = [
    { label: "Today", value: todayCount ?? 0, icon: CalendarDays, color: "text-[var(--clinic-primary)]", bg: "bg-[var(--clinic-accent)]" },
    { label: "This week", value: weekCount ?? 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total bookings", value: totalCount ?? 0, icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Patients", value: patientCount ?? 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  // ── Bookings query ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("appointments")
    .select("id, start_at, end_at, status, is_virtual, confirmation_code, reason, guest_name, guest_email, providers(name), services(name), locations(name)")
    .eq("clinic_id", clinic.id)
    .order("start_at", { ascending: false })
    .limit(100)

  if (status) query = query.eq("status", status)

  const { data } = await query
  const bookings = (data ?? []) as Booking[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All appointments for {clinic.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="border border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Suspense>
          <StatusFilter />
        </Suspense>
        <p className="text-xs text-muted-foreground">
          {bookings.length} result{bookings.length !== 1 ? "s" : ""}
          {status ? ` · ${status}` : ""}
        </p>
      </div>

      {/* Table */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No bookings found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
          {/* Desktop table header */}
          <div className="hidden grid-cols-[1fr_140px_140px_110px_140px] gap-4 border-b border-border/60 bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Patient</span>
            <span>Service</span>
            <span>Provider</span>
            <span>Date & Time</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-border/60">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_140px_140px_110px_140px] md:items-center md:gap-4"
              >
                {/* Patient */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="truncate text-sm font-medium text-foreground">
                      {booking.guest_name ?? "Guest"}
                    </p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[booking.status] ?? STATUS_STYLES.scheduled}`}>
                      {booking.status}
                    </span>
                  </div>
                  {booking.guest_email && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {booking.guest_email}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground/50">
                    #{booking.confirmation_code}
                  </p>
                </div>

                {/* Service */}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {booking.is_virtual && <Video className="h-3.5 w-3.5 shrink-0 text-[var(--clinic-primary)]" />}
                  <span className="truncate">{booking.services?.name ?? "—"}</span>
                </div>

                {/* Provider */}
                <p className="truncate text-sm text-muted-foreground">
                  {booking.providers?.name ?? "—"}
                </p>

                {/* Date & time */}
                <div className="text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {formatDate(booking.start_at)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {formatTime(booking.start_at)}
                  </p>
                  {!booking.is_virtual && booking.locations?.name && (
                    <p className="mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{booking.locations.name.split("—")[1]?.trim() ?? booking.locations.name}</span>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <BookingRowActions
                  appointmentId={booking.id}
                  status={booking.status}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
