import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Search, CalendarDays, Mail, Phone } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Patients" }

type Patient = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  created_at: string
}

type Props = { searchParams: Promise<{ q?: string }> }

export default async function AdminPatientsPage({ searchParams }: Props) {
  const { q } = await searchParams
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  let query = supabase
    .from("patients")
    .select("id, first_name, last_name, email, phone, created_at")
    .eq("clinic_id", clinic.id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
    )
  }

  const { data } = await query
  const patients = (data ?? []) as Patient[]

  // Fetch appointment counts in parallel
  const withCounts = await Promise.all(
    patients.map(async (p) => {
      const [{ count: total }, { count: upcoming }] = await Promise.all([
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", p.id),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", p.id)
          .neq("status", "cancelled")
          .gte("start_at", new Date().toISOString()),
      ])
      return { ...p, total: total ?? 0, upcoming: upcoming ?? 0 }
    })
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} registered at {clinic.name}.
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </form>

      {/* Table */}
      {withCounts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {q ? "No patients match your search." : "No patients yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Contact</th>
                <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground md:table-cell">Appts</th>
                <th className="hidden px-4 py-3 text-center font-medium text-muted-foreground lg:table-cell">Upcoming</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {withCounts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--clinic-accent)] text-xs font-bold text-[var(--clinic-primary)]">
                        {p.first_name.charAt(0)}{p.last_name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="font-medium text-foreground hover:text-[var(--clinic-primary)]"
                        >
                          {p.first_name} {p.last_name}
                        </Link>
                        <p className="text-xs text-muted-foreground sm:hidden">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{p.email}</span>
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    <span className="font-medium text-foreground">{p.total}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-center lg:table-cell">
                    {p.upcoming > 0 ? (
                      <Badge className="border-green-200 bg-green-50 text-green-700">
                        <CalendarDays className="mr-1 h-3 w-3" />
                        {p.upcoming}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
