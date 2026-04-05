import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/webhook-verify";
import { forwardEmail } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify Svix signature
    const secret = process.env.RESEND_WEBHOOK_SECRET || "";
    const verified = await verifyWebhookSignature(
      rawBody,
      {
        "svix-id": request.headers.get("svix-id"),
        "svix-timestamp": request.headers.get("svix-timestamp"),
        "svix-signature": request.headers.get("svix-signature"),
      },
      secret
    );

    if (!verified) {
      return Response.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    // Only process email.received events
    if (event.type !== "email.received") {
      return Response.json({ received: true, skipped: true });
    }

    const data = event.data;

    // Extract sender email/name from "from" field
    // Handles "Name <email>" format and plain email
    let fromEmail = "";
    let fromName = "";
    const fromField: string = data.from || "";
    const angleMatch = fromField.match(/^(.+?)\s*<(.+?)>$/);
    if (angleMatch) {
      fromName = angleMatch[1].trim();
      fromEmail = angleMatch[2].trim();
    } else {
      fromEmail = fromField.trim();
    }

    // Match sender to Contact by email
    const contact = await prisma.contact.findUnique({
      where: { email: fromEmail },
    });

    // Get the most recent outreach for that contact
    let outreach = null;
    if (contact) {
      outreach = await prisma.outreach.findFirst({
        where: { contactId: contact.id },
        orderBy: { createdAt: "desc" },
      });
    }

    // Create InboundEmail record
    const inboundEmail = await prisma.inboundEmail.create({
      data: {
        resendId: data.id || null,
        fromEmail,
        fromName,
        toEmail: data.to || "",
        subject: data.subject || "(sans objet)",
        bodyText: data.text || null,
        bodyHtml: data.html || null,
        rawWebhookData: event,
        contactId: contact?.id || null,
        outreachId: outreach?.id || null,
        receivedAt: new Date(),
      },
    });

    // If matched outreach exists and status != "replied", update to "replied"
    if (outreach && outreach.status !== "replied") {
      await prisma.outreach.update({
        where: { id: outreach.id },
        data: {
          status: "replied",
          lastContactDate: new Date(),
        },
      });
    }

    // Update the last sent Email's repliedAt field
    if (outreach) {
      const lastSentEmail = await prisma.email.findFirst({
        where: { outreachId: outreach.id, status: "sent" },
        orderBy: { sentAt: "desc" },
      });
      if (lastSentEmail) {
        await prisma.email.update({
          where: { id: lastSentEmail.id },
          data: { repliedAt: new Date() },
        });
      }
    }

    // Create a Notification record
    await prisma.notification.create({
      data: {
        type: "reply_received",
        title: contact
          ? `Reponse de ${fromName || fromEmail}`
          : `Email recu de ${fromName || fromEmail}`,
        body: data.subject || null,
        data: {
          inboundEmailId: inboundEmail.id,
          contactId: contact?.id || null,
          outreachId: outreach?.id || null,
        },
      },
    });

    // Forward the email to Ousmane
    try {
      await forwardEmail({
        to: "ousmane.thienta@audencia.com",
        subject: `[BreakIn] Fwd: ${data.subject || "(sans objet)"}`,
        body: data.text || data.html || "(contenu vide)",
        language: "fr",
      });

      // Mark inboundEmail as forwarded
      await prisma.inboundEmail.update({
        where: { id: inboundEmail.id },
        data: { forwardedAt: new Date() },
      });
    } catch (fwdError) {
      console.error("Failed to forward inbound email:", fwdError);
      // Don't fail the webhook because of forwarding issues
    }

    return Response.json({
      received: true,
      inboundEmailId: inboundEmail.id,
      matched: !!contact,
      contactId: contact?.id || null,
      outreachId: outreach?.id || null,
    });
  } catch (error) {
    console.error("POST /api/webhooks/resend error:", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
