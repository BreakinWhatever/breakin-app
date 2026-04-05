import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/apollo";
import { getMaxEmailsPerDay } from "@/lib/settings";
import { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the email with full context including campaign template for language
    const email = await prisma.email.findUnique({
      where: { id },
      include: {
        outreach: {
          include: {
            contact: true,
            emails: true,
            campaign: {
              include: {
                template: true,
              },
            },
          },
        },
      },
    });

    if (!email) {
      return Response.json({ error: "Email not found" }, { status: 404 });
    }

    if (email.status !== "approved") {
      return Response.json(
        { error: "Email must be approved before sending" },
        { status: 400 }
      );
    }

    // Check daily limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await prisma.email.count({
      where: {
        status: "sent",
        sentAt: { gte: startOfDay },
      },
    });

    const maxPerDay = await getMaxEmailsPerDay();

    if (sentToday >= maxPerDay) {
      return Response.json(
        {
          error: `Daily email limit reached (${maxPerDay}). Try again tomorrow.`,
          sentToday,
          maxPerDay,
        },
        { status: 429 }
      );
    }

    // Determine language from the campaign's template (default: "fr")
    const language =
      email.outreach.campaign?.template?.language ?? "fr";

    // Send via AgentMail API
    await sendEmail({
      to: email.outreach.contact.email,
      subject: email.subject,
      body: email.body,
      language,
    });

    const now = new Date();

    // Update email status
    const updatedEmail = await prisma.email.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: now,
      },
    });

    // Update outreach status
    const outreach = email.outreach;
    const sentEmails = outreach.emails.filter((e) => e.status === "sent");
    const followUpCount = sentEmails.length; // current email will be next

    let newStatus: string;
    if (email.type === "initial") {
      newStatus = "contacted";
    } else {
      newStatus = "followed_up";
    }

    await prisma.outreach.update({
      where: { id: outreach.id },
      data: {
        status: newStatus,
        lastContactDate: now,
        nextActionType: `followup_${followUpCount + 1}`,
        nextActionDate: new Date(
          now.getTime() + 3 * 24 * 60 * 60 * 1000
        ), // default 3 days
      },
    });

    return Response.json({
      email: updatedEmail,
      sentToday: sentToday + 1,
      maxPerDay,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("POST /api/emails/[id]/send error:", message);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
