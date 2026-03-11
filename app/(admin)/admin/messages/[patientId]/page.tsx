import { notFound } from "next/navigation"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { AdminMessageComposer } from "@/components/admin/admin-message-composer"
import { markThreadRead } from "@/lib/actions/messages"
import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Thread" }

type Props = { params: Promise<{ patientId: string }> }

type Message = {
  id: string
  sender_role: "patient" | "admin"
  body: string
  created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export default async function AdminThreadPage({ params }: Props) {
  const { patientId } = await params
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Fetch patient info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patient } = await supabase
    .from("patients")
    .select("id, first_name, last_name, email")
    .eq("id", patientId)
    .eq("clinic_id", clinic.id)
    .single()

  if (!patient) notFound()

  const p = patient as { id: string; first_name: string; last_name: string; email: string }

  // Fetch messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_role, body, created_at")
    .eq("patient_id", patientId)
    .eq("clinic_id", clinic.id)
    .order("created_at", { ascending: true })

  const messages = (msgs ?? []) as Message[]

  // Mark patient messages as read
  await markThreadRead(patientId)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/messages"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All messages
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {p.first_name} {p.last_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{p.email}</p>
      </div>

      {/* Thread */}
      <div className="space-y-3 min-h-[20rem]">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages in this thread yet.
          </p>
        )}
        {messages.map((msg) => {
          const isAdmin = msg.sender_role === "admin"
          return (
            <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[75%] flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-[var(--clinic-primary)] text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.body}
                </div>
                <p className="px-1 text-xs text-muted-foreground">
                  {isAdmin ? clinic.name : `${p.first_name}`} · {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply */}
      <AdminMessageComposer patientId={patientId} />
    </div>
  )
}
