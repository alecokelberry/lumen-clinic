import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { MessageComposer } from "@/components/portal/message-composer"
import { MessageSquare } from "lucide-react"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Messages" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

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

export default async function MessagesPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  let patientId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")

    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("clerk_user_id", userId)
      .single()
    patientId = (patient as { id: string } | null)?.id ?? null
  }

  const messages: Message[] = []
  if (patientId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await supabase
      .from("messages")
      .select("id, sender_role, body, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true })
    messages.push(...((data ?? []) as Message[]))
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure messaging with {clinic.name}.
        </p>
      </div>

      {/* Thread */}
      <div className="space-y-3 min-h-[20rem]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No messages yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Send a message to your care team below.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isPatient = msg.sender_role === "patient"
          return (
            <div key={msg.id} className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[75%] flex-col gap-1 ${isPatient ? "items-end" : "items-start"}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isPatient
                      ? "bg-[var(--clinic-primary)] text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.body}
                </div>
                <p className="px-1 text-xs text-muted-foreground">
                  {isPatient ? "You" : clinic.name} · {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Composer */}
      {patientId ? (
        <MessageComposer />
      ) : (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Book an appointment first to enable messaging with your care team.
        </div>
      )}
    </div>
  )
}
