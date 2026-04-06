import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { sendEmailViaResend } from "@/lib/resend";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email: string = body?.email?.trim() ?? "";

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    // Upsert — silently ignore if email already exists
    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Fire-and-forget emails — never fail the request on email error
    try {
      await sendEmailViaResend({
        to: email,
        subject: "You're on the BreakIn waitlist",
        body: "You're in. We'll reach out when BreakIn opens its doors.\n\n— Ousmane, founder of BreakIn",
        language: "en",
      });

      await sendEmailViaResend({
        to: "ousmane.thienta@audencia.com",
        subject: "New BreakIn waitlist signup",
        body: `New signup: ${email}\n\nTime: ${new Date().toISOString()}`,
        language: "fr",
      });
    } catch (emailError) {
      console.error("Waitlist email send failed:", emailError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
