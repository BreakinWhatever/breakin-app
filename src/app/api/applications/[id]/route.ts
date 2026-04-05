import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: { offer: true, contact: true, coverLetter: true },
    });

    if (!application) {
      return Response.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return Response.json(application);
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch application" },
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

    // If status changes to "applied" and appliedAt is null, auto-set appliedAt
    if (body.status === "applied") {
      const existing = await prisma.application.findUnique({ where: { id } });
      if (existing && !existing.appliedAt) {
        body.appliedAt = new Date();
      }
    }

    // Convert nextStepDate string to Date if present
    if (body.nextStepDate) {
      body.nextStepDate = new Date(body.nextStepDate);
    }

    await prisma.application.update({
      where: { id },
      data: body,
    });

    const application = await prisma.application.findUnique({
      where: { id },
      include: { offer: true, contact: true, coverLetter: true },
    });

    return Response.json(application);
  } catch (error) {
    console.error("PUT /api/applications/[id] error:", error);
    return Response.json(
      { error: "Failed to update application" },
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

    await prisma.application.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/applications/[id] error:", error);
    return Response.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
