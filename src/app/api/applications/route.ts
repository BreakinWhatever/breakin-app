import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { role: { contains: search } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: { offer: true, contact: true, coverLetter: true },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(applications);
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return Response.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { companyName, role } = body;
    if (!companyName || !role) {
      return Response.json(
        { error: "companyName and role are required" },
        { status: 400 }
      );
    }

    const created = await prisma.application.create({
      data: {
        companyName,
        role,
        offerId: body.offerId ?? null,
        contactId: body.contactId ?? null,
        source: body.source ?? "manual",
        status: body.status ?? "draft",
        notes: body.notes ?? null,
        nextStep: body.nextStep ?? null,
        nextStepDate: body.nextStepDate ? new Date(body.nextStepDate) : null,
      },
    });

    // If offerId provided, update the offer's status to "applied"
    if (body.offerId) {
      await prisma.jobOffer.update({
        where: { id: body.offerId },
        data: { status: "applied" },
      });
    }

    const application = await prisma.application.findUnique({
      where: { id: created.id },
      include: { offer: true, contact: true, coverLetter: true },
    });

    return Response.json(application, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications error:", error);
    return Response.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
