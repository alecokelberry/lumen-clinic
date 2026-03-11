import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { FileText } from "lucide-react"
import { redirect } from "next/navigation"
import { UploadForm } from "./upload-form"
import { RecordRow } from "./record-row"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Medical Records" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

const CATEGORY_ORDER = ["lab_result", "imaging", "visit_summary", "insurance", "other"]

type MedRecord = {
  id: string
  category: string
  name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  notes: string | null
  created_at: string
}

export default async function RecordsPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  let patientId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    const { data: patient } = await supabase
      .from("patients").select("id")
      .eq("clinic_id", clinic.id).eq("clerk_user_id", userId).single()
    patientId = (patient as { id: string } | null)?.id ?? null
  }

  const records: MedRecord[] = []
  if (patientId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await supabase
      .from("medical_records")
      .select("id, category, name, file_path, file_size, mime_type, notes, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
    records.push(...((data ?? []) as MedRecord[]))
  }

  // Group by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, MedRecord[]>>((acc, cat) => {
    const items = records.filter((r) => r.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  const CATEGORY_LABELS: Record<string, string> = {
    lab_result:    "Lab Results",
    imaging:       "Imaging",
    visit_summary: "Visit Summaries",
    insurance:     "Insurance",
    other:         "Other Documents",
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lab results, visit summaries, and health documents.
          </p>
        </div>
        {patientId && <UploadForm />}
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">No documents yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Upload lab results, insurance cards, imaging reports, or any health document.
            </p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {items.map((rec) => (
                <RecordRow
                  key={rec.id}
                  id={rec.id}
                  name={rec.name}
                  category={rec.category}
                  filePath={rec.file_path}
                  fileSize={rec.file_size}
                  mimeType={rec.mime_type}
                  notes={rec.notes}
                  createdAt={rec.created_at}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
