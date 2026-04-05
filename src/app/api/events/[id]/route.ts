import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }

    // Split include queries for Neon HTTP compatibility
    const [contact, company] = await Promise.all([
      event.contactId
        ? prisma.contact.findUnique({ where: { id: event.contactId } })
        : Promise.resolve(null),
      event.companyId
        ? prisma.company.findUnique({ where: { id: event.companyId } })
        : Promise.resolve(null),
    ]);

    return Response.json({ ...event, contact, company });
  } catch (error) {
    console.error("GET /api/events/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Convert date strings to Date objects if present
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);

    await prisma.event.update({
      where: { id },
      data: body,
    });

    const event = await prisma.event.findUnique({
      where: { id },
    });

    return Response.json(event);
  } catch (error) {
    console.error("PUT /api/events/[id] error:", error);
    return Response.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.event.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/events/[id] error:", error);
    return Response.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
