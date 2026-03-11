import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, TrendingUp, TrendingDown, UserX, Users, CheckCircle2, Clock, XCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Overview" }

function startOfMonth(offset = 0) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  d.setHours(0, 0, 0, 0)
  return d
}

function pct(a: number, b: number) {
  if (b === 0) return null
  const diff = ((a - b) / b) * 100
  return diff
}

export default async function AdminOverviewPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const thisMonthStart = startOfMonth(0).toISOString()
  const lastMonthStart = startOfMonth(-1).toISOString()
  const now = new Date().toISOString()

  // ── Aggregate counts ──────────────────────────────────────────────────────
  const [
    { count: thisMonthTotal },
    { count: lastMonthTotal },
    { count: noShowCount },
    { count: cancelledCount },
    { count: completedCount },
    { count: upcomingCount },
    { count: patientCount },
    { data: topServicesData },
  ] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id).gte("start_at", thisMonthStart),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id).gte("start_at", lastMonthStart).lt("start_at", thisMonthStart),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id).eq("status", "no-show"),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id).eq("status", "cancelled"),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id).eq("status", "completed"),
    supabase.from("appointments").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id).neq("status", "cancelled").gte("start_at", now),
    supabase.from("patients").select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id),
    // Top services — join + group by name
    supabase
      .from("appointments")
      .select("services(name)")
      .eq("clinic_id", clinic.id)
      .neq("status", "cancelled")
      .not("service_id", "is", null),
  ])

  // Tally top services client-side (Supabase free tier doesn't expose rpc groupby easily)
  const serviceTally: Record<string, number> = {}
  for (const row of (topServicesData ?? []) as { services: { name: string } | null }[]) {
    const name = row.services?.name
    if (name) serviceTally[name] = (serviceTally[name] ?? 0) + 1
  }
  const topServices = Object.entries(serviceTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const momChange = pct(thisMonthTotal ?? 0, lastMonthTotal ?? 0)

  const STATS = [
    {
      label: "This month",
      value: thisMonthTotal ?? 0,
      icon: CalendarDays,
      color: "text-[var(--clinic-primary)]",
      bg: "bg-[var(--clinic-accent)]",
      sub: momChange === null
        ? "vs last month"
        : `${momChange >= 0 ? "+" : ""}${momChange.toFixed(0)}% vs last month`,
      trend: momChange !== null && momChange >= 0 ? "up" : "down",
    },
    {
      label: "Upcoming",
      value: upcomingCount ?? 0,
      icon: Clock,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      sub: "scheduled ahead",
      trend: "neutral",
    },
    {
      label: "Completed",
      value: completedCount ?? 0,
      icon: CheckCircle2,
      color: "text-violet-600",
      bg: "bg-violet-50",
      sub: "all time",
      trend: "neutral",
    },
    {
      label: "Patients",
      value: patientCount ?? 0,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
      sub: "registered",
      trend: "neutral",
    },
  ]

  const STATUS_BREAKDOWN = [
    { label: "Completed", value: completedCount ?? 0, color: "bg-violet-500" },
    { label: "Cancelled", value: cancelledCount ?? 0, color: "bg-red-400" },
    { label: "No-shows", value: noShowCount ?? 0, color: "bg-orange-400" },
    { label: "Upcoming", value: upcomingCount ?? 0, color: "bg-emerald-500" },
  ]
  const breakdownTotal = STATUS_BREAKDOWN.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Performance summary for {clinic.name}.
        </p>
      </div>

      {/* KPI cards */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Booking breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_BREAKDOWN.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${row.color}`} />
                <span className="flex-1 text-sm text-foreground">{row.label}</span>
                <span className="text-sm font-semibold text-foreground">{row.value}</span>
                <div className="w-24 overflow-hidden rounded-full bg-muted h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${row.color}`}
                    style={{ width: breakdownTotal > 0 ? `${(row.value / breakdownTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}

            {breakdownTotal === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Top services */}
        <Card className="border border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Top services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topServices.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              topServices.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate text-sm text-foreground">{name}</span>
                  <span className="text-sm font-semibold text-foreground">{count}</span>
                  <div className="w-24 overflow-hidden rounded-full bg-muted h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-[var(--clinic-primary)]"
                      style={{ width: `${(count / (topServices[0][1] || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Attention items */}
        <Card className="border border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
              <UserX className="h-5 w-5 shrink-0 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{noShowCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">No-shows total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{cancelledCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">Cancellations total</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <TrendingDown className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {(breakdownTotal > 0
                    ? (((noShowCount ?? 0) / breakdownTotal) * 100).toFixed(1)
                    : "0.0")}%
                </p>
                <p className="text-xs text-muted-foreground">No-show rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
