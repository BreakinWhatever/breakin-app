import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (fromDate && !isNaN(fromDate.getTime()) && toDate && !isNaN(toDate.getTime())) {
      where.startDate = {
        gte: fromDate,
        lte: toDate,
      };
    } else if (fromDate && !isNaN(fromDate.getTime())) {
      where.startDate = { gte: fromDate };
    } else if (toDate && !isNaN(toDate.getTime())) {
      where.startDate = { lte: toDate };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
    });

    // Split include queries for Neon HTTP compatibility
    const contactIds = [...new Set(events.filter((e) => e.contactId).map((e) => e.contactId!))];
    const companyIds = [...new Set(events.filter((e) => e.companyId).map((e) => e.companyId!))];

    const [contacts, companies] = await Promise.all([
      contactIds.length > 0
        ? prisma.contact.findMany({ where: { id: { in: contactIds } } })
        : Promise.resolve([]),
      companyIds.length > 0
        ? prisma.company.findMany({ where: { id: { in: companyIds } } })
        : Promise.resolve([]),
    ]);

    const contactMap = new Map(contacts.map((c) => [c.id, c]));
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const enriched = events.map((event) => ({
      ...event,
      contact: event.contactId ? contactMap.get(event.contactId) ?? null : null,
      company: event.companyId ? companyMap.get(event.companyId) ?? null : null,
    }));

    return Response.json(enriched);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, startDate, endDate } = body;
    if (!title || !startDate || !endDate) {
      return Response.json(
        { error: "title, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const created = await prisma.event.create({
      data: {
        title,
        description: body.description ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: body.type ?? "interview",
        contactId: body.contactId ?? null,
        companyId: body.companyId ?? null,
        outreachId: body.outreachId ?? null,
        location: body.location ?? null,
        notes: body.notes ?? null,
        color: body.color ?? null,
      },
    });

    const event = await prisma.event.findUnique({
      where: { id: created.id },
    });

    return Response.json(event, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return Response.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
