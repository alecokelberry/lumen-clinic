"use client"

import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Loader2, FileText, X } from "lucide-react"
import { uploadRecord } from "@/lib/actions/records"

const CATEGORIES = [
  { value: "lab_result",     label: "Lab result" },
  { value: "imaging",        label: "Imaging / X-ray" },
  { value: "insurance",      label: "Insurance card" },
  { value: "visit_summary",  label: "Visit summary" },
  { value: "other",          label: "Other" },
]

export function UploadForm() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState("other")
  const [notes, setNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    fd.append("category", category)
    fd.append("notes", notes)
    startTransition(async () => {
      const result = await uploadRecord(fd)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Document uploaded.")
        setFile(null)
        setNotes("")
        setCategory("other")
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload document
      </Button>
    )
  }

  return (
    <Card className="border border-border/60">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Upload document</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* File picker */}
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-8 text-center transition-colors hover:border-[var(--clinic-primary)]/40 hover:bg-muted/20"
        >
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          {file ? (
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground">Click to choose a file</p>
              <p className="text-xs text-muted-foreground">PDF, image, or Word doc · max 10 MB</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  category === c.value
                    ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                    : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Blood panel from March 2026"
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || isPending}
            className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
