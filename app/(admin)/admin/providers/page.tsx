import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CalendarDays, UserPlus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Providers" }

type Provider = {
  id: string
  name: string
  title: string
  bio: string | null
  photo_url: string | null
}

type ProviderWithStats = Provider & {
  upcomingCount: number
  totalCount: number
}

export default async function AdminProvidersPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: providers } = await supabase
    .from("providers")
    .select("id, name, title, bio, photo_url")
    .eq("clinic_id", clinic.id)
    .order("name")

  const providerList = (providers ?? []) as Provider[]

  // Fetch upcoming + total count per provider
  const now = new Date().toISOString()

  const withStats: ProviderWithStats[] = await Promise.all(
    providerList.map(async (p) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [{ count: upcomingCount }, { count: totalCount }] = await Promise.all([
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", p.id)
          .neq("status", "cancelled")
          .gte("start_at", now),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", p.id),
      ])
      return { ...p, upcomingCount: upcomingCount ?? 0, totalCount: totalCount ?? 0 }
    })
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Providers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {withStats.length} provider{withStats.length !== 1 ? "s" : ""} at {clinic.name}.
          </p>
        </div>
        <Button asChild className="bg-[var(--clinic-primary)] text-white hover:opacity-90 shrink-0">
          <Link href="/admin/providers/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add provider
          </Link>
        </Button>
      </div>

      {/* Provider grid */}
      {withStats.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <Users className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No providers yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withStats.map((provider) => (
            <Card key={provider.id} className="border border-border/60">
              <CardContent className="p-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  {provider.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={provider.photo_url}
                      alt={provider.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--clinic-primary)]/10 text-lg font-bold text-[var(--clinic-primary)]">
                      {provider.name.charAt(provider.name.lastIndexOf(" ") + 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{provider.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{provider.title}</p>
                  </div>
                </div>

                {/* Bio */}
                {provider.bio && (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{provider.bio}</p>
                )}

                {/* Stats */}
                <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      <strong className="font-semibold text-foreground">{provider.upcomingCount}</strong> upcoming
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong className="font-semibold text-foreground">{provider.totalCount}</strong> total
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-auto border-green-200 bg-green-50 text-green-700 text-xs"
                  >
                    Active
                  </Badge>
                </div>

                {/* Actions */}
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href={`/admin/providers/${provider.id}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link href={`/admin/providers/${provider.id}/schedule`}>
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      Schedule
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
