import { redirect } from "next/navigation"

/**
 * Call inside any Server Component or Server Action that requires admin access.
 * Reads Clerk publicMetadata.role — set this in the Clerk dashboard:
 *   Users → [user] → Metadata → Public → { "role": "admin" }
 */
export async function requireAdmin(): Promise<void> {
  const { currentUser } = await import("@clerk/nextjs/server")
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  const role = (user.publicMetadata as { role?: string })?.role
  if (role !== "admin") redirect("/dashboard")
}
