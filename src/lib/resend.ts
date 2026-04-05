// Resend API Client for BreakIn
// Docs: https://resend.com/docs/api-reference

import { prisma } from "@/lib/db";

const RESEND_BASE_URL = "https://api.resend.com";

const FROM_FR = "Ousmane Thienta <candidatures@ousmanethienta.com>";
const FROM_EN = "Ousmane Thienta <applications@ousmanethienta.com>";

async function getResendApiKey(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key: "resendApiKey" },
  });
  return setting?.value || process.env.RESEND_API_KEY || "";
}

export interface ResendSendOptions {
  to: string;
  subject: string;
  body: string;
  language?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export async function sendEmailViaResend(options: ResendSendOptions) {
  const apiKey = await getResendApiKey();
  if (!apiKey) {
    throw new Error("Resend API key not configured. Add it in Settings (key: resendApiKey).");
  }

  const from = (options.language ?? "fr") === "en" ? FROM_EN : FROM_FR;

  const htmlBody = `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${options.body.replace(/\n/g, "<br>")}</div>`;

  const response = await fetch(`${RESEND_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: options.to,
      subject: options.subject,
      html: htmlBody,
      text: options.body,
      ...(options.attachments ? { attachments: options.attachments } : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend send error ${response.status}: ${text}`);
  }

  return response.json();
}
