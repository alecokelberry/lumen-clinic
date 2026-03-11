import { notFound } from "next/navigation"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { ChevronLeft } from "lucide-react"
import { ProviderForm } from "./provider-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Provider" }

type Props = { params: Promise<{ id: string }> }

export default async function ProviderEditPage({ params }: Props) {
  const { id } = await params
  const isNew = id === "new"

  let provider: {
    id: string
    name: string
    title: string | null
    bio: string | null
    npi: string | null
    specialties: string[]
    is_active: boolean
  } | undefined = undefined

  if (!isNew) {
    const clinic = await getClinic()
    const supabase = await createServiceClient()

    const { data } = await supabase
      .from("providers")
      .select("id, name, title, bio, npi, specialties, is_active")
      .eq("id", id)
      .eq("clinic_id", clinic.id)
      .single()

    if (!data) notFound()
    provider = data as {
      id: string; name: string; title: string | null; bio: string | null
      npi: string | null; specialties: string[]; is_active: boolean
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/admin/providers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Providers
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? "Add provider" : "Edit provider"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isNew
            ? "Add a new provider to your clinic."
            : `Editing ${provider?.name ?? ""}`}
        </p>
      </div>

      <ProviderForm provider={provider} />
    </div>
  )
}
