import { prisma } from "@/lib/db";
import {
  getFollowUpSpacing,
  getMaxFollowUps,
  getMaxEmailsPerDay,
} from "@/lib/settings";

export async function GET() {
  try {
    const now = new Date();

    // Start of today (midnight)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Outreaches needing follow-up:
    // - status is "contacted" or "followed_up"
    // - nextActionDate is in the past or today
    // - nextActionType is not "none"
    const pending = await prisma.outreach.findMany({
      where: {
        status: { in: ["contacted", "followed_up", "followup_1", "followup_2", "followup_3"] },
        nextActionDate: { lte: now },
        NOT: { nextActionType: "none" },
      },
      include: {
        contact: {
          include: { company: true },
        },
        campaign: true,
        emails: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { nextActionDate: "asc" },
    });

    // Count emails sent today
    const sentToday = await prisma.email.count({
      where: {
        status: "sent",
        sentAt: { gte: startOfDay },
      },
    });

    // Load relevant settings
    const [followUpSpacing, maxFollowUps, maxEmailsPerDay] = await Promise.all([
      getFollowUpSpacing(),
      getMaxFollowUps(),
      getMaxEmailsPerDay(),
    ]);

    return Response.json({
      pending,
      sentToday,
      settings: {
        followUpSpacing,
        maxFollowUps,
        maxEmailsPerDay,
      },
    });
  } catch (error) {
    console.error("GET /api/agent/pending error:", error);
    return Response.json(
      { error: "Failed to fetch pending outreaches" },
      { status: 500 }
    );
  }
}
