import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Messages" }

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure messaging with your care team.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">No messages yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Secure messaging with your providers is coming soon. For urgent questions, call the clinic directly.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/locations">Find clinic contact</Link>
        </Button>
      </div>
    </div>
  )
}
