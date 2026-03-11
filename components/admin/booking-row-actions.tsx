"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { confirmAppointment, cancelAppointment } from "@/lib/actions/appointments"
import { Loader2, Check, X } from "lucide-react"

interface Props {
  appointmentId: string
  status: string
}

export function BookingRowActions({ appointmentId, status }: Props) {
  const [isPending, startTransition] = useTransition()

  const canConfirm = status === "scheduled"
  const canCancel = !["cancelled", "completed", "no-show"].includes(status)

  if (!canConfirm && !canCancel) return null

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmAppointment(appointmentId)
      if (result.error) toast.error(result.error)
      else toast.success("Appointment confirmed.")
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      const result = await cancelAppointment(appointmentId)
      if (result.error) toast.error(result.error)
      else toast.success("Appointment cancelled.")
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {canConfirm && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-green-200 bg-green-50 px-2.5 text-xs text-green-700 hover:bg-green-100"
          onClick={handleConfirm}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" />Confirm</>}
        </Button>
      )}
      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="mr-1 h-3 w-3" />Cancel</>}
        </Button>
      )}
    </div>
  )
}
