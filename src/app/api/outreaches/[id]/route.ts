import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

function getNextBusinessDay(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  // Skip weekends: Saturday (6) -> Monday, Sunday (0) -> Monday
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const outreach = await prisma.outreach.findUnique({
      where: { id },
      include: {
        contact: {
          include: { company: true },
        },
        campaign: {
          include: { template: true },
        },
        emails: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!outreach) {
      return Response.json({ error: "Outreach not found" }, { status: 404 });
    }

    return Response.json(outreach);
  } catch (error) {
    console.error("GET /api/outreaches/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch outreach" },
      { status: 500 }
    );
  }
}

const VALID_STATUSES = [
  "identified",
  "contacted",
  "followup_1",
  "followup_2",
  "followup_3",
  "replied",
  "interview",
  "offer",
  // Legacy values kept for backwards compatibility
  "followed_up",
  "entretien",
  "offre",
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return Response.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects if present
    if (body.lastContactDate) {
      body.lastContactDate = new Date(body.lastContactDate);
    }
    if (body.nextActionDate) {
      body.nextActionDate = new Date(body.nextActionDate);
    }

    // Check if we're transitioning to "interview" status
    const isMovingToInterview = body.status === "interview";

    await prisma.outreach.update({
      where: { id },
      data: body,
    });

    const outreach = await prisma.outreach.findUnique({
      where: { id },
      include: {
        contact: { include: { company: true } },
        campaign: true,
      },
    });

    // Auto-create interview event when status moves to "interview"
    if (isMovingToInterview && outreach) {
      const nextBusinessDay = getNextBusinessDay();
      nextBusinessDay.setHours(10, 0, 0, 0);
      const endTime = new Date(nextBusinessDay);
      endTime.setHours(11, 0, 0, 0);

      const contactName = outreach.contact
        ? `${outreach.contact.firstName} ${outreach.contact.lastName}`
        : "";
      const companyName = outreach.contact?.company?.name ?? "";
      const title = `Entretien${companyName ? ` — ${companyName}` : ""}${contactName ? ` (${contactName})` : ""}`;

      await prisma.event.create({
        data: {
          title,
          startDate: nextBusinessDay,
          endDate: endTime,
          type: "interview",
          contactId: outreach.contactId,
          companyId: outreach.contact?.companyId ?? null,
          outreachId: outreach.id,
        },
      });
    }

    return Response.json(outreach);
  } catch (error) {
    console.error("PUT /api/outreaches/[id] error:", error);
    return Response.json(
      { error: "Failed to update outreach" },
      { status: 500 }
    );
  }
}
