import { NextRequest } from "next/server";

// Server-side logo proxy — no CORS, 24h cache
// Usage: GET /api/logo?domain=goldmansachs.com

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return new Response("Invalid domain", { status: 400 });
  }

  try {
    const res = await fetch(`https://logo.clearbit.com/${domain}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      // Next.js cache: revalidate after 24h
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new Response(null, { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
