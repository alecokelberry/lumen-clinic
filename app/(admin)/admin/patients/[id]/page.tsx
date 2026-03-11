import { notFound } from "next/navigation"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Mail, Phone, MessageSquare, CalendarDays } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Patient" }

type Props = { params: Promise<{ id: string }> }

type Appt = {
  id: string
  start_at: string
  status: string
  confirmation_code: string
  services: { name: string } | null
  providers: { name: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:  "border-blue-200 bg-blue-50 text-blue-700",
  confirmed:  "border-green-200 bg-green-50 text-green-700",
  completed:  "border-gray-200 bg-gray-50 text-gray-600",
  cancelled:  "border-red-200 bg-red-50 text-red-600",
  "no-show":  "border-amber-200 bg-amber-50 text-amber-700",
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, last_name, email, phone, dob, created_at")
    .eq("id", id)
    .eq("clinic_id", clinic.id)
    .single()

  if (!patient) notFound()

  const p = patient as {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    dob: string | null
    created_at: string
  }

  const { data: appts } = await supabase
    .from("appointments")
    .select("id, start_at, status, confirmation_code, services(name), providers(name)")
    .eq("patient_id", id)
    .order("start_at", { ascending: false })
    .limit(50)

  const appointments = (appts ?? []) as Appt[]

  const [{ count: messageCount }] = await Promise.all([
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", id),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/patients"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Patients
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--clinic-accent)] text-lg font-bold text-[var(--clinic-primary)]">
              {p.first_name.charAt(0)}{p.last_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{p.first_name} {p.last_name}</h1>
              <p className="text-sm text-muted-foreground">
                Patient since {new Date(p.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/messages/${p.id}`}>
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Message
              {messageCount ? (
                <span className="ml-1.5 rounded-full bg-[var(--clinic-primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {messageCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      {/* Contact info */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${p.email}`} className="text-foreground hover:underline">{p.email}</a>
          </div>
          {p.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${p.phone}`} className="text-foreground hover:underline">{p.phone}</a>
            </div>
          )}
          {p.dob && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>DOB: {new Date(p.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment history */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Appointments
            <span className="ml-2 text-sm font-normal text-muted-foreground">({appointments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {a.services?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.providers?.name ?? ""} ·{" "}
                      {new Date(a.start_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      ,{" "}
                      {new Date(a.start_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden text-xs text-muted-foreground sm:block">#{a.confirmation_code}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_STYLES[a.status] ?? ""}`}
                    >
                      {a.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
