// Handwritten types matching the live Supabase schema.
// Run `npx supabase gen types typescript --project-id ezmktsrucdkzjrkpyigb > lib/supabase/types.ts`
// after `supabase login` to replace with fully generated types.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Makes nullable columns optional in Insert/Update types (mirrors Supabase code-gen behaviour) */
type Insertable<T> = {
  [K in keyof T as null extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as null extends T[K] ? K : never]?: T[K]
}

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" }
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          slug: string
          custom_domain: string | null
          name: string
          tagline: string | null
          logo_url: string | null
          hero_image_url: string | null
          primary_color: string
          accent_color: string | null
          theme: Json
          settings: Json
          timezone: string
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["clinics"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["clinics"]["Insert"]>
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          clinic_id: string
          clerk_user_id: string
          first_name: string
          last_name: string
          dob: string | null
          phone: string | null
          email: string
          insurance: Json | null
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["patients"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>
        Relationships: []
      }
      providers: {
        Row: {
          id: string
          clinic_id: string
          name: string
          title: string | null
          bio: string | null
          photo_url: string | null
          specialties: string[]
          npi: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["providers"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["providers"]["Insert"]>
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          clinic_id: string
          name: string
          address: string
          city: string | null
          state: string | null
          zip: string | null
          phone: string | null
          timezone: string
          lat: number | null
          lng: number | null
          hours: Json
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["locations"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>
        Relationships: []
      }
      services: {
        Row: {
          id: string
          clinic_id: string
          name: string
          description: string | null
          duration_min: number
          is_virtual: boolean
          price_cents: number | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["services"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>
        Relationships: []
      }
      provider_schedules: {
        Row: {
          id: string
          provider_id: string
          location_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration_min: number
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["provider_schedules"]["Row"], "id">>
        Update: Partial<Database["public"]["Tables"]["provider_schedules"]["Insert"]>
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string | null
          provider_id: string
          location_id: string
          service_id: string
          start_at: string
          end_at: string
          status: "scheduled" | "confirmed" | "cancelled" | "no-show" | "completed"
          is_virtual: boolean
          meeting_url: string | null
          reason: string | null
          intake_answers: Json | null
          confirmation_code: string
          guest_name: string | null
          guest_email: string | null
          guest_phone: string | null
          created_at: string
        }
        Insert: Insertable<Omit<
          Database["public"]["Tables"]["appointments"]["Row"],
          "id" | "created_at" | "confirmation_code"
        >> & { confirmation_code?: string }
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          sender_role: "patient" | "admin"
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
        Relationships: []
      }
      medical_records: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          uploaded_by: "patient" | "admin"
          category: "lab_result" | "imaging" | "insurance" | "visit_summary" | "other"
          name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          notes: string | null
          created_at: string
        }
        Insert: Insertable<Omit<Database["public"]["Tables"]["medical_records"]["Row"], "id" | "created_at">>
        Update: Partial<Database["public"]["Tables"]["medical_records"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Clinic         = Database["public"]["Tables"]["clinics"]["Row"]
export type Patient        = Database["public"]["Tables"]["patients"]["Row"]
export type Provider       = Database["public"]["Tables"]["providers"]["Row"]
export type Location       = Database["public"]["Tables"]["locations"]["Row"]
export type Service        = Database["public"]["Tables"]["services"]["Row"]
export type Appointment    = Database["public"]["Tables"]["appointments"]["Row"]
export type Message        = Database["public"]["Tables"]["messages"]["Row"]
export type MedicalRecord  = Database["public"]["Tables"]["medical_records"]["Row"]
