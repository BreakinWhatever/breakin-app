import { createHmac } from "node:crypto";
import { appendApplyJobEvent, updateApplyJobRecord } from "./jobs";
import { launchLocalApplyDispatcher } from "./launcher";

const DEFAULT_APPLY_WEBHOOK_URL = "http://46.225.210.206:9000/hooks/apply-offer";

export interface ApplyDispatchResult {
  ok: boolean;
  mode: "local" | "remote";
  message?: string;
  statusCode?: number;
}

export async function dispatchApplyJob(
  workspaceDir: string,
  jobId: string,
  offerId: string
): Promise<ApplyDispatchResult> {
  const mode = resolveApplyDispatchMode();
  if (mode === "local") {
    return dispatchApplyJobLocally(workspaceDir, jobId);
  }

  return dispatchApplyJobRemotely(jobId, offerId);
}

export async function failApplyDispatch(
  offerId: string,
  jobId: string,
  message: string
) {
  const { prisma } = await import("@/lib/db");
  const endedAt = new Date();

  await Promise.allSettled([
    prisma.jobOffer.update({
      where: { id: offerId },
      data: { status: "apply_failed" },
    }),
    updateApplyJobRecord(jobId, {
      status: "failed",
      error: message,
      lastMessage: message,
      endedAt,
    }),
    appendApplyJobEvent(jobId, "dispatch_failed", message),
  ]);
}

export function resolveApplyDispatchMode(): "local" | "remote" {
  const configured = process.env.APPLY_DISPATCH_MODE;
  if (configured === "local" || configured === "remote") {
    return configured;
  }

  return process.env.VERCEL === "1" ? "remote" : "local";
}

async function dispatchApplyJobLocally(
  workspaceDir: string,
  jobId: string
): Promise<ApplyDispatchResult> {
  const launched = await launchLocalApplyDispatcher(workspaceDir, jobId);

  if (launched.ok) {
    return {
      ok: true,
      mode: "local",
      message: launched.pid ? `dispatcher pid ${launched.pid}` : undefined,
    };
  }

  return {
    ok: false,
    mode: "local",
    message: launched.error ?? "Failed to launch local apply dispatcher",
  };
}

async function dispatchApplyJobRemotely(
  jobId: string,
  offerId: string
): Promise<ApplyDispatchResult> {
  const webhookUrl = process.env.APPLY_DISPATCH_WEBHOOK_URL ?? DEFAULT_APPLY_WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      ok: false,
      mode: "remote",
      message: "Missing WEBHOOK_SECRET for remote apply dispatch",
    };
  }

  const payload = JSON.stringify({ job_id: jobId, offer_id: offerId });
  const signature = createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": `sha256=${signature}`,
      },
      body: payload,
    });

    if (response.ok) {
      return {
        ok: true,
        mode: "remote",
        statusCode: response.status,
      };
    }

    const body = (await response.text().catch(() => "")).trim();
    return {
      ok: false,
      mode: "remote",
      statusCode: response.status,
      message: body
        ? `Remote apply webhook returned ${response.status}: ${body.slice(0, 300)}`
        : `Remote apply webhook returned ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      mode: "remote",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
