import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import type { Provider } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Providers" }

export default async function ProvidersPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from("providers")
    .select("*")
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  const providers = (data ?? []) as Provider[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mb-12 max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Our providers
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Specialists who combine deep expertise with genuine care.
        </p>
      </div>

      {providers.length === 0 ? (
        <p className="text-muted-foreground">No providers listed yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="overflow-hidden border border-border/60 transition-shadow hover:shadow-sm"
            >
              <div className="flex gap-0">
                {/* Photo or initials */}
                <div className="flex w-32 shrink-0 items-center justify-center bg-gradient-to-br from-[var(--clinic-accent)] to-muted md:w-40">
                  {provider.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={provider.photo_url}
                      alt={provider.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--clinic-primary)]/10 text-2xl font-bold text-[var(--clinic-primary)]">
                      {provider.name.charAt(3)}
                    </div>
                  )}
                </div>

                <CardContent className="flex flex-1 flex-col p-5">
                  <div>
                    <p className="font-semibold text-foreground">{provider.name}</p>
                    {provider.title && (
                      <p className="text-sm text-muted-foreground">{provider.title}</p>
                    )}
                  </div>

                  {provider.bio && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {provider.bio}
                    </p>
                  )}

                  {provider.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {provider.specialties.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="border-[var(--clinic-primary)]/20 bg-[var(--clinic-accent)] text-[var(--clinic-primary)] text-xs"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      asChild
                      size="sm"
                      className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
                    >
                      <Link href={`/book?provider=${provider.id}`}>
                        <CalendarDays className="mr-2 h-3.5 w-3.5" />
                        Book with {provider.name.split(" ")[1]}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
