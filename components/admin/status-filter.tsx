"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const STATUSES = [
  { value: "", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No-show" },
]

export function StatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get("status") ?? ""

  const setStatus = (value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value) p.set("status", value)
    else p.delete("status")
    router.push(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => setStatus(s.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            current === s.value
              ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
              : "border-border bg-background text-muted-foreground hover:border-[var(--clinic-primary)]/40 hover:text-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
