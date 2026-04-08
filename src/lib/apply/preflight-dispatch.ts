import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { launchLocalApplyPreflightDispatcher } from "./preflight-launcher";
import { updateApplyPreflightJobRecord } from "./preflight-jobs";

const DEFAULT_APPLY_PREFLIGHT_WEBHOOK_URL = "http://46.225.210.206:9000/hooks/apply-preflight";

export interface ApplyPreflightDispatchResult {
  ok: boolean;
  mode: "local" | "remote";
  message?: string;
  statusCode?: number;
}

export async function dispatchApplyPreflightJob(
  workspaceDir: string,
  jobId: string,
  offerId: string
): Promise<ApplyPreflightDispatchResult> {
  const mode = resolveApplyPreflightDispatchMode();
  if (mode === "local") {
    return dispatchApplyPreflightJobLocally(workspaceDir, jobId);
  }

  return dispatchApplyPreflightJobRemotely(jobId, offerId);
}

export async function failApplyPreflightDispatch(
  offerId: string,
  jobId: string,
  message: string
) {
  const endedAt = new Date();
  await Promise.allSettled([
    prisma.jobOffer.update({
      where: { id: offerId },
      data: {
        applyReadiness: "blocked",
        preflightError: message,
        lastPreflightAt: endedAt,
      },
    }),
    updateApplyPreflightJobRecord(jobId, {
      status: "failed",
      error: message,
      lastMessage: message,
      endedAt,
    }),
  ]);
}

export function resolveApplyPreflightDispatchMode(): "local" | "remote" {
  const configured = process.env.APPLY_PREFLIGHT_DISPATCH_MODE;
  if (configured === "local" || configured === "remote") {
    return configured;
  }

  return process.env.VERCEL === "1" ? "remote" : "local";
}

async function dispatchApplyPreflightJobLocally(
  workspaceDir: string,
  jobId: string
): Promise<ApplyPreflightDispatchResult> {
  const launched = await launchLocalApplyPreflightDispatcher(workspaceDir, jobId);
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
    message: launched.error ?? "Failed to launch local preflight dispatcher",
  };
}

async function dispatchApplyPreflightJobRemotely(
  jobId: string,
  offerId: string
): Promise<ApplyPreflightDispatchResult> {
  const webhookUrl = process.env.APPLY_PREFLIGHT_WEBHOOK_URL ?? DEFAULT_APPLY_PREFLIGHT_WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      ok: false,
      mode: "remote",
      message: "Missing WEBHOOK_SECRET for remote preflight dispatch",
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
        ? `Remote preflight webhook returned ${response.status}: ${body.slice(0, 300)}`
        : `Remote preflight webhook returned ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      mode: "remote",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
