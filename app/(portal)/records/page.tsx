import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Medical Records" }

export default function RecordsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lab results, visit summaries, and health documents.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No records yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            After your first visit, lab results and visit summaries will appear here — no paper, no PDFs.
          </p>
        </div>
        <Button asChild className="bg-[var(--clinic-primary)] text-white hover:opacity-90" size="sm">
          <Link href="/book">Book your first visit</Link>
        </Button>
      </div>
    </div>
  )
}
