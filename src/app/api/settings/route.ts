import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();

    // Convert array of {key, value} to a key-value object
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return Response.json(result);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // body is expected to be a key-value object: { key1: "value1", key2: "value2" }
    const entries = Object.entries(body) as [string, string][];

    const upserts = entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(upserts);

    // Return the updated settings
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return Response.json(result);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
