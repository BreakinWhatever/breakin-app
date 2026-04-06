import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_PATHS = [
  "/api/auth/token",       // Token management endpoint (protected by admin secret)
  "/api/calendar/feed",    // iCal feed is public (uses its own secret in URL)
  "/api/waitlist",         // Waitlist signup — no auth required
  "/api/logo",             // Logo proxy — public, no auth required
];

// Check if request comes from the app's own frontend (same origin)
function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // Server-side rendering (no origin/referer) — allow
  if (!origin && !referer) return true;

  // Check if origin or referer matches the host
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) return true;
    } catch {
      // Invalid origin URL
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) return true;
    } catch {
      // Invalid referer URL
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip auth for public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow same-origin requests (frontend calling its own API)
  if (isSameOriginRequest(request)) {
    return NextResponse.next();
  }

  // External requests must provide a Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  // Validate the token against the env var
  // Note: Prisma can't run in Edge Runtime, so we use BREAKIN_API_TOKEN env var
  const validToken = process.env.BREAKIN_API_TOKEN;

  if (!validToken) {
    // No token configured — deny all external requests
    return NextResponse.json(
      { error: "API authentication not configured" },
      { status: 503 }
    );
  }

  if (token !== validToken) {
    return NextResponse.json(
      { error: "Invalid API token" },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
