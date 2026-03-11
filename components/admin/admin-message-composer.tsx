"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { SendHorizonal, Loader2 } from "lucide-react"
import { sendAdminMessage } from "@/lib/actions/messages"

export function AdminMessageComposer({ patientId }: { patientId: string }) {
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSend = () => {
    if (!body.trim()) return
    startTransition(async () => {
      const result = await sendAdminMessage(patientId, body)
      if (result.error) {
        toast.error(result.error)
      } else {
        setBody("")
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-3 border-t border-border/60 pt-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Reply to patient… (⌘+Enter to send)"
        rows={3}
        className="resize-none flex-1"
        disabled={isPending}
      />
      <Button
        onClick={handleSend}
        disabled={!body.trim() || isPending}
        className="self-end bg-[var(--clinic-primary)] text-white hover:opacity-90"
      >
        {isPending
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <SendHorizonal className="h-4 w-4" />
        }
      </Button>
    </div>
  )
}
