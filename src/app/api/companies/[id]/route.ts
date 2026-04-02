import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: { contacts: true },
    });

    if (!company) {
      return Response.json({ error: "Company not found" }, { status: 404 });
    }

    return Response.json(company);
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch company" },
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

    const company = await prisma.company.update({
      where: { id },
      data: body,
    });

    return Response.json(company);
  } catch (error) {
    console.error("PUT /api/companies/[id] error:", error);
    return Response.json(
      { error: "Failed to update company" },
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

    await prisma.company.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/companies/[id] error:", error);
    return Response.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
