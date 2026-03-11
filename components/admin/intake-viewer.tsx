"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ClipboardList } from "lucide-react"

interface IntakeAnswers {
  reason?: string
  medications?: string
  allergies?: string
  medical_history?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  insurance_carrier?: string
  insurance_member_id?: string
}

interface Props {
  answers: IntakeAnswers
  patientName: string
}

const FIELDS: { key: keyof IntakeAnswers; label: string }[] = [
  { key: "reason", label: "Reason for visit" },
  { key: "medications", label: "Current medications" },
  { key: "allergies", label: "Allergies" },
  { key: "medical_history", label: "Medical history" },
  { key: "emergency_contact_name", label: "Emergency contact" },
  { key: "emergency_contact_phone", label: "Emergency phone" },
  { key: "insurance_carrier", label: "Insurance carrier" },
  { key: "insurance_member_id", label: "Member ID" },
]

export function IntakeViewer({ answers, patientName }: Props) {
  const filled = FIELDS.filter((f) => answers[f.key]?.trim())

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
          <ClipboardList className="h-3 w-3" />
          Intake ✓
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Intake Form</SheetTitle>
          <p className="text-sm text-muted-foreground">{patientName}</p>
        </SheetHeader>

        <div className="space-y-5">
          {filled.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers recorded.</p>
          ) : (
            filled.map(({ key, label }) => (
              <div key={key}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="whitespace-pre-wrap rounded-lg bg-muted/40 px-3 py-2.5 text-sm text-foreground">
                  {answers[key]}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
