import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get("companyId");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(contacts);
  } catch (error) {
    console.error("GET /api/contacts error:", error);
    return Response.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { firstName, lastName, companyId, title, email } = body;
    if (!firstName || !lastName || !companyId || !title || !email) {
      return Response.json(
        {
          error:
            "firstName, lastName, companyId, title, and email are required",
        },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        companyId,
        title,
        email,
        linkedinUrl: body.linkedinUrl ?? null,
        apolloId: body.apolloId ?? null,
        priority: body.priority ?? 3,
        source: body.source ?? "manual",
        notes: body.notes ?? null,
      },
      include: { company: true },
    });

    return Response.json(contact, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacts error:", error);
    return Response.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
