import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
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
    <>
      {/* Page header */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="font-bold text-slate-900" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
            Our providers
          </h1>
          <p className="mt-2 text-slate-500">
            Specialists who combine deep expertise with genuine care.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {providers.length === 0 ? (
          <p className="text-slate-500">No providers listed yet.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {providers.map((provider) => {
              const initials = provider.name.split(" ").filter(p => !p.endsWith(".")).slice(0, 2).map(n => n[0]).join("")
              const firstName = provider.name.split(" ").find(p => !p.endsWith(".")) ?? provider.name
              return (
                <div key={provider.id} className="flex overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
                  {/* Photo / initials */}
                  <div className="flex w-32 shrink-0 items-center justify-center md:w-40" style={{ background: "#f1f5f9" }}>
                    {provider.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={provider.photo_url} alt={provider.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold" style={{ color: "var(--clinic-primary)", opacity: 0.2 }}>
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-5">
                    <div>
                      <p className="font-semibold text-slate-900">{provider.name}</p>
                      {provider.title && (
                        <p className="text-sm text-slate-500">{provider.title}</p>
                      )}
                    </div>

                    {provider.bio && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                        {provider.bio}
                      </p>
                    )}

                    {provider.specialties.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {provider.specialties.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                            style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#2563eb" }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <Button
                        asChild
                        size="sm"
                        className="text-white hover:opacity-90"
                        style={{ background: "var(--clinic-primary)" }}
                      >
                        <Link href={`/book?provider=${provider.id}`}>
                          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                          Book with {firstName}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
