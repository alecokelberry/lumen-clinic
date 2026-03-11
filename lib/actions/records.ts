"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { revalidatePath } from "next/cache"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

export async function uploadRecord(formData: FormData): Promise<{ error?: string }> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Resolve patient
  let patientId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) return { error: "Not authenticated." }
    const { data: p } = await supabase
      .from("patients").select("id")
      .eq("clinic_id", clinic.id).eq("clerk_user_id", userId).single()
    patientId = (p as { id: string } | null)?.id ?? null
  }
  if (!patientId) return { error: "Patient record not found." }

  const file = formData.get("file") as File | null
  type RecordCategory = "lab_result" | "imaging" | "insurance" | "visit_summary" | "other"
  const category = ((formData.get("category") as string) || "other") as RecordCategory
  const notes = (formData.get("notes") as string) || ""

  if (!file || file.size === 0) return { error: "No file selected." }
  if (file.size > MAX_BYTES) return { error: "File must be under 10 MB." }
  if (!ALLOWED_TYPES.has(file.type)) return { error: "File type not supported." }

  const ext = file.name.split(".").pop() ?? "bin"
  const filePath = `${clinic.id}/${patientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const fileBody = new Uint8Array(arrayBuffer)

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("medical-records")
    .upload(filePath, fileBody, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  // Insert DB row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await supabase
    .from("medical_records")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      uploaded_by: "patient",
      category,
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      notes: notes.trim() || null,
    })

  if (dbError) {
    // Clean up orphaned storage object
    await supabase.storage.from("medical-records").remove([filePath])
    return { error: dbError.message }
  }

  revalidatePath("/records")
  return {}
}

export async function getSignedUrl(filePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage
    .from("medical-records")
    .createSignedUrl(filePath, 60 * 60) // 1 hour
  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

export async function deleteRecord(recordId: string, filePath: string): Promise<{ error?: string }> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Verify ownership
  let patientId: string | null = null
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) return { error: "Not authenticated." }
    const { data: p } = await supabase
      .from("patients").select("id")
      .eq("clinic_id", clinic.id).eq("clerk_user_id", userId).single()
    patientId = (p as { id: string } | null)?.id ?? null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await supabase
    .from("medical_records")
    .delete()
    .eq("id", recordId)
    .eq("patient_id", patientId ?? "")

  if (dbError) return { error: dbError.message }

  await supabase.storage.from("medical-records").remove([filePath])

  revalidatePath("/records")
  return {}
}
