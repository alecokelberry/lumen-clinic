import { NextResponse } from "next/server"
import type { NextRequest, NextFetchEvent } from "next/server"

const PORTAL_PATHS = ["/dashboard", "/appointments", "/messages", "/records", "/billing", "/forms", "/settings"]
const ADMIN_PATHS = ["/admin"]

function isProtectedPath(pathname: string) {
  return (
    PORTAL_PATHS.some((p) => pathname.startsWith(p)) ||
    ADMIN_PATHS.some((p) => pathname.startsWith(p))
  )
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
const clerkConfigured = clerkKey.length > 0 && !clerkKey.includes("your_clerk")

// Dynamically build the handler so Clerk never initializes with a bad key
async function buildHandler() {
  if (clerkConfigured) {
    const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server")
    const isPortalRoute = createRouteMatcher(PORTAL_PATHS.map((p) => `${p}(.*)`))
    const isAdminRoute = createRouteMatcher(ADMIN_PATHS.map((p) => `${p}(.*)`))

    return clerkMiddleware(async (auth, req: NextRequest) => {
      const requestHeaders = resolveTenant(req)
      if (isPortalRoute(req) || isAdminRoute(req)) {
        await auth.protect()
      }
      // Fast edge role check using sessionClaims — works when Clerk JWT template
      // includes publicMetadata (Clerk dashboard → JWT Templates → add publicMetadata).
      // The layout's requireAdmin() provides the definitive fallback check.
      if (isAdminRoute(req)) {
        const { sessionClaims } = await auth()
        const meta = sessionClaims?.metadata as { role?: string } | undefined
        if (meta && meta.role !== "admin") {
          const url = req.nextUrl.clone()
          url.pathname = "/dashboard"
          return NextResponse.redirect(url)
        }
      }
      return NextResponse.next({ request: { headers: requestHeaders } })
    })
  }

  // No Clerk — plain tenant-resolution proxy
  return async function handler(req: NextRequest) {
    const requestHeaders = resolveTenant(req)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
}

function resolveTenant(req: NextRequest): Headers {
  const hostname = req.headers.get("host") ?? ""
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lumenclinic.health"
  const hostWithoutPort = hostname.replace(/:\d+$/, "")

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", req.nextUrl.pathname)

  if (
    hostWithoutPort !== rootDomain &&
    hostWithoutPort !== `www.${rootDomain}` &&
    hostWithoutPort !== "localhost"
  ) {
    const slug = hostWithoutPort.endsWith(`.${rootDomain}`)
      ? hostWithoutPort.replace(`.${rootDomain}`, "")
      : hostWithoutPort
    requestHeaders.set("x-clinic-slug", slug)
  }

  return requestHeaders
}

const handlerPromise = buildHandler()

export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const handler = await handlerPromise
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (handler as any)(req, event)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
