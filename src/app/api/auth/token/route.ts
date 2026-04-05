import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

function generateToken(): string {
  return `bk_${randomBytes(32).toString("hex")}`;
}

export async function GET(request: NextRequest) {
  try {
    // Protect with admin secret
    const adminSecret = process.env.BREAKIN_ADMIN_SECRET;
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!adminSecret || providedSecret !== adminSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.setting.findUnique({
      where: { key: "apiToken" },
    });

    return Response.json({
      exists: !!setting,
      // Show only last 8 chars for security
      tokenPreview: setting ? `...${setting.value.slice(-8)}` : null,
    });
  } catch (error) {
    console.error("GET /api/auth/token error:", error);
    return Response.json({ error: "Failed to fetch token" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Protect with admin secret
    const adminSecret = process.env.BREAKIN_ADMIN_SECRET;
    const authHeader = request.headers.get("authorization");
    const providedSecret = authHeader?.replace("Bearer ", "");

    if (!adminSecret || providedSecret !== adminSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = generateToken();

    // Store in the database (for reference / rotation tracking)
    await prisma.setting.upsert({
      where: { key: "apiToken" },
      update: { value: token },
      create: { key: "apiToken", value: token },
    });

    return Response.json({
      token,
      message: "Token generated. Add this as BREAKIN_API_TOKEN env var on Vercel and in the VPS CLAUDE.md.",
    });
  } catch (error) {
    console.error("POST /api/auth/token error:", error);
    return Response.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
