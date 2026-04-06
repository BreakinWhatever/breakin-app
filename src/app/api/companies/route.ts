import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const city = searchParams.get("city");
    const sector = searchParams.get("sector");
    const search = searchParams.get("search");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};
    if (city) where.city = city;
    if (sector) where.sector = sector;
    if (search) where.name = { contains: search };
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(companies);
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return Response.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, sector, city, country } = body;
    if (!name || !sector || !city || !country) {
      return Response.json(
        { error: "name, sector, city, and country are required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
        sector,
        city,
        country,
        size: body.size ?? "",
        website: body.website ?? null,
        apolloId: body.apolloId ?? null,
        notes: body.notes ?? null,
        atsType: body.atsType ?? null,
        careerUrl: body.careerUrl ?? null,
        atsConfig: body.atsConfig ?? null,
        active: body.active ?? true,
      },
    });

    return Response.json(company, { status: 201 });
  } catch (error) {
    console.error("POST /api/companies error:", error);
    return Response.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
