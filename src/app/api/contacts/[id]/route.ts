import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        outreaches: {
          include: {
            emails: true,
          },
        },
        inboundEmails: {
          orderBy: { receivedAt: "desc" },
        },
      },
    });

    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 });
    }

    return Response.json(contact);
  } catch (error) {
    console.error("GET /api/contacts/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch contact" },
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

    await prisma.contact.update({
      where: { id },
      data: body,
    });

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { company: true },
    });

    return Response.json(contact);
  } catch (error) {
    console.error("PUT /api/contacts/[id] error:", error);
    return Response.json(
      { error: "Failed to update contact" },
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

    await prisma.contact.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contacts/[id] error:", error);
    return Response.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
