import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const language = searchParams.get("language");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (language) where.language = language;
    if (category) where.category = category;

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return Response.json(templates);
  } catch (error) {
    console.error("GET /api/templates error:", error);
    return Response.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, subject, body: templateBody } = body;
    if (!name || !subject || !templateBody) {
      return Response.json(
        { error: "name, subject, and body are required" },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        subject,
        body: templateBody,
        variables: Array.isArray(body.variables)
          ? JSON.stringify(body.variables)
          : body.variables ?? "[]",
        language: body.language ?? "fr",
        category: body.category ?? "initial",
      },
    });

    return Response.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates error:", error);
    return Response.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
