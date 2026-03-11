"use client"

import { useEffect } from "react"

interface ClinicBrandProviderProps {
  primaryColor: string
  accentColor: string
  children: React.ReactNode
}

/**
 * Injects per-clinic CSS variables into :root so the entire page
 * inherits the clinic's brand colors without a page reload.
 */
export function ClinicBrandProvider({
  primaryColor,
  accentColor,
  children,
}: ClinicBrandProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--clinic-primary", primaryColor)
    root.style.setProperty("--clinic-accent", accentColor)
    // Also update the shadcn primary for branded buttons/links
    root.style.setProperty("--primary", hexToOklch(primaryColor))
  }, [primaryColor, accentColor])

  return <>{children}</>
}

// Simple hex → oklch approximation for CSS var injection.
// For production, use a proper color library (e.g. culori).
function hexToOklch(hex: string): string {
  // Fallback: just return a reasonable slate for non-blue defaults.
  // The clinic-primary CSS var handles real branding visuals.
  return "oklch(0.45 0.2 250)"
}
