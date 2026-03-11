"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Download, Trash2, Loader2, FileText, Image, File } from "lucide-react"
import { getSignedUrl, deleteRecord } from "@/lib/actions/records"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const CATEGORY_LABELS: Record<string, string> = {
  lab_result:    "Lab result",
  imaging:       "Imaging",
  insurance:     "Insurance",
  visit_summary: "Visit summary",
  other:         "Document",
}

function FileIcon({ mime }: { mime: string | null }) {
  if (mime?.startsWith("image/")) return <Image className="h-5 w-5 text-[var(--clinic-primary)]" />
  return <FileText className="h-5 w-5 text-[var(--clinic-primary)]" />
}

function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface Props {
  id: string
  name: string
  category: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  notes: string | null
  createdAt: string
}

export function RecordRow({ id, name, category, filePath, fileSize, mimeType, notes, createdAt }: Props) {
  const [downloading, startDownload] = useTransition()
  const [deleting, startDelete] = useTransition()

  const handleDownload = () => {
    startDownload(async () => {
      const result = await getSignedUrl(filePath)
      if (result.error) {
        toast.error(result.error)
      } else {
        window.open(result.url, "_blank")
      }
    })
  }

  const handleDelete = () => {
    startDelete(async () => {
      const result = await deleteRecord(id, filePath)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Document deleted.")
      }
    })
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--clinic-accent)]">
        <FileIcon mime={mimeType} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
            {CATEGORY_LABELS[category] ?? "Document"}
          </span>
          {fileSize && <span>{formatSize(fileSize)}</span>}
          <span>{formatDate(createdAt)}</span>
        </div>
        {notes && <p className="mt-1 truncate text-xs text-muted-foreground">{notes}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDownload}
          disabled={downloading}
          title="Download"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={deleting}
              title="Delete"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
              <AlertDialogDescription>
                "{name}" will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
