import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    return Response.json(template);
  } catch (error) {
    console.error("GET /api/templates/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch template" },
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

    // Stringify variables if passed as an array
    if (Array.isArray(body.variables)) {
      body.variables = JSON.stringify(body.variables);
    }

    const template = await prisma.template.update({
      where: { id },
      data: body,
    });

    return Response.json(template);
  } catch (error) {
    console.error("PUT /api/templates/[id] error:", error);
    return Response.json(
      { error: "Failed to update template" },
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

    await prisma.template.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/templates/[id] error:", error);
    return Response.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
