import { ImapFlow } from "imapflow";

export interface VerificationArtifact {
  link: string | null;
  code: string | null;
  from: string;
  subject: string;
  preview: string;
}

interface WaitOptions {
  targetEmail: string;
  providerHint: string;
  timeoutMs?: number;
  intervalMs?: number;
}

export async function waitForVerificationArtifact(
  options: WaitOptions
): Promise<VerificationArtifact | null> {
  const host = process.env.IMAP_HOST ?? "imap.mail.me.com";
  const port = Number(process.env.IMAP_PORT ?? 993);
  const user = process.env.IMAP_USER ?? "";
  const pass = process.env.IMAP_PASSWORD ?? "";

  if (!user || !pass) {
    return null;
  }

  const client = new ImapFlow({
    host,
    port,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  const startedAfter = new Date(Date.now() - 10 * 60_000);
  const deadline = Date.now() + (options.timeoutMs ?? 120_000);
  const intervalMs = options.intervalMs ?? 10_000;

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    while (Date.now() < deadline) {
      for await (const message of client.fetch(
        { since: startedAfter },
        { envelope: true, source: true }
      )) {
        const subject = message.envelope?.subject ?? "";
        const from = message.envelope?.from?.[0]?.address ?? "";
        const sourceText = Buffer.from(message.source ?? []).toString("utf8");
        if (!matchesTargetEmail(sourceText, options.targetEmail)) continue;
        if (!matchesProvider(from, subject, sourceText, options.providerHint)) continue;

        const parsed = extractVerificationArtifact(sourceText, subject, from);
        if (parsed.link || parsed.code) {
          return parsed;
        }
      }

      await sleep(intervalMs);
    }

    return null;
  } finally {
    await client.logout().catch(() => {});
  }
}

function matchesTargetEmail(source: string, targetEmail: string) {
  if (!targetEmail) return true;
  const lowered = source.toLowerCase();
  return lowered.includes(targetEmail.toLowerCase());
}

function matchesProvider(
  from: string,
  subject: string,
  source: string,
  providerHint: string
) {
  const haystack = `${from}\n${subject}\n${source}`.toLowerCase();
  if (providerHint === "workday") {
    return /workday|myworkdayjobs|wd\d+/i.test(haystack);
  }
  if (providerHint === "greenhouse" || providerHint === "lever") {
    return /greenhouse|lever/i.test(haystack);
  }
  if (providerHint === "smartrecruiters") {
    return /smartrecruiters/i.test(haystack);
  }
  if (providerHint === "taleo") {
    return /taleo|oracle/i.test(haystack);
  }
  return /verify|verification|confirm|activate|code/i.test(haystack);
}

function extractVerificationArtifact(
  source: string,
  subject: string,
  from: string
): VerificationArtifact {
  const urls = Array.from(
    new Set(source.match(/https?:\/\/[^\s<>"')]+/gi) ?? [])
  );
  const link = urls.find((value) =>
    /verify|confirm|activate|validation|token|code|email/i.test(value)
  ) ?? null;
  const codeMatch = source.match(/\b(\d{6})\b/);

  return {
    link,
    code: codeMatch?.[1] ?? null,
    from,
    subject,
    preview: source.slice(0, 500),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
