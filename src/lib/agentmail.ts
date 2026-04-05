// AgentMail API Client for BreakIn
// Docs: https://docs.agentmail.to/api-reference

import { prisma } from "@/lib/db";

const AGENTMAIL_BASE_URL = "https://api.agentmail.to/v0";

// Inbox IDs — these are the email addresses themselves on AgentMail
// When custom domain is configured, update these to use @ousmanethienta.com
const INBOX_FR = "candidatures-ousmanethienta@agentmail.to";
const INBOX_EN = "applications-ousmanethienta@agentmail.to";

async function getAgentMailApiKey(): Promise<string> {
  const setting = await prisma.setting.findUnique({
    where: { key: "agentmailApiKey" },
  });
  return setting?.value || process.env.AGENTMAIL_API_KEY || "";
}

// ---------- Types ----------

export interface AgentMailSendOptions {
  to: string;
  subject: string;
  body: string;
  language?: string; // "fr" or "en" — determines which inbox to send from
  html?: string;
  replyTo?: string;
}

export interface AgentMailSendResult {
  message_id: string;
  thread_id: string;
}

// ---------- Helpers ----------

/**
 * Returns the inbox ID (email address) based on the language.
 * French campaigns use the candidatures inbox, English campaigns use applications.
 */
export function getInboxForLanguage(language: string): string {
  return language === "en" ? INBOX_EN : INBOX_FR;
}

// ---------- API Calls ----------

/**
 * Send an email via the AgentMail API.
 *
 * Uses POST /v0/inboxes/{inbox_id}/messages/send
 * The inbox is selected based on the language parameter:
 *   - "fr" (default) -> candidatures-ousmanethienta@agentmail.to
 *   - "en"           -> applications-ousmanethienta@agentmail.to
 */
export async function sendEmailViaAgentMail(
  options: AgentMailSendOptions
): Promise<AgentMailSendResult> {
  const apiKey = await getAgentMailApiKey();
  if (!apiKey) {
    throw new Error(
      "AgentMail API key not configured. Add it in Settings (key: agentmailApiKey)."
    );
  }

  const inboxId = getInboxForLanguage(options.language ?? "fr");

  // Build HTML body — if html is provided use it, otherwise wrap plain text
  const htmlBody =
    options.html ||
    `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${options.body.replace(/\n/g, "<br>")}</div>`;

  const response = await fetch(
    `${AGENTMAIL_BASE_URL}/inboxes/${encodeURIComponent(inboxId)}/messages/send`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        text: options.body,
        html: htmlBody,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AgentMail send error ${response.status}: ${text}`);
  }

  return response.json();
}

/**
 * List inboxes on the AgentMail account (for diagnostics).
 */
export async function listInboxes() {
  const apiKey = await getAgentMailApiKey();

  const response = await fetch(`${AGENTMAIL_BASE_URL}/inboxes`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AgentMail list inboxes error ${response.status}: ${text}`);
  }

  return response.json();
}
