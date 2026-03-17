import type { Metadata } from "next"

export const metadata: Metadata = { title: "Welcome" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export default function RootPage() {
  const portalHref = clerkConfigured ? "/sign-in" : "/dashboard"
  const adminHref = clerkConfigured ? "/sign-in?redirect_url=%2Fadmin" : "/admin"

  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "1rem" }}>
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
          Lumen Clinic
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
          Choose how you&apos;d like to sign in
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <a
          href={portalHref}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "2rem",
            textAlign: "center",
            textDecoration: "none",
            width: "160px",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>Patient Portal</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Appointments &amp; records</p>
          </div>
        </a>

        <a
          href={adminHref}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
            borderRadius: "1rem",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "2rem",
            textAlign: "center",
            textDecoration: "none",
            width: "160px",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>Admin</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Clinic dashboard</p>
          </div>
        </a>
      </div>
    </div>
  )
}
