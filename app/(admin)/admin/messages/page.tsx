import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { markThreadRead } from "@/lib/actions/messages"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Messages" }

type Thread = {
  patient_id: string
  patient_name: string
  last_body: string
  last_at: string
  unread_count: number
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default async function AdminMessagesPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Fetch all messages for this clinic, joined with patient names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: msgs } = await supabase
    .from("messages")
    .select("patient_id, body, created_at, sender_role, read_at, patients(first_name, last_name)")
    .eq("clinic_id", clinic.id)
    .order("created_at", { ascending: false })

  // Build thread summaries client-side
  const threadMap = new Map<string, Thread>()
  for (const m of (msgs ?? []) as {
    patient_id: string
    body: string
    created_at: string
    sender_role: string
    read_at: string | null
    patients: { first_name: string; last_name: string } | null
  }[]) {
    if (!threadMap.has(m.patient_id)) {
      threadMap.set(m.patient_id, {
        patient_id: m.patient_id,
        patient_name: m.patients
          ? `${m.patients.first_name} ${m.patients.last_name}`
          : "Unknown Patient",
        last_body: m.body,
        last_at: m.created_at,
        unread_count: 0,
      })
    }
    // Count unread patient messages
    if (m.sender_role === "patient" && !m.read_at) {
      threadMap.get(m.patient_id)!.unread_count++
    }
  }

  const threads = Array.from(threadMap.values()).sort(
    (a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime()
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {threads.map((thread) => (
            <Link key={thread.patient_id} href={`/admin/messages/${thread.patient_id}`} style={{ display: "block", borderRadius: "0.75rem", border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <div className="flex items-center gap-4 cursor-pointer" style={{ padding: "0.875rem 1.25rem" }}>
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "rgba(37,99,235,0.08)", color: "var(--clinic-primary)" }}>
                  {thread.patient_name.charAt(0)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-foreground">{thread.patient_name}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">{formatTime(thread.last_at)}</p>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{thread.last_body}</p>
                </div>

                {/* Unread badge */}
                {thread.unread_count > 0 && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--clinic-primary)" }}>
                    {thread.unread_count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
