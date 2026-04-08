import { NextRequest } from "next/server";
import { isApplyPreflightEnabled } from "@/lib/apply/config";
import { serializePreflightJob, serializeApplyJob } from "@/lib/apply/payloads";
import { ensureOfferApplyReady } from "@/lib/apply/preflight";
import {
  dispatchApplyPreflightJob,
  failApplyPreflightDispatch,
} from "@/lib/apply/preflight-dispatch";
import { enqueueApplyJob } from "@/lib/apply/service";
import { dispatchApplyJob, failApplyDispatch } from "@/lib/apply/dispatch";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceDir = process.cwd();

    if (isApplyPreflightEnabled()) {
      const readiness = await ensureOfferApplyReady(workspaceDir, {
        offerId: id,
        source: "site",
      });

      if (!readiness.ready) {
        if (readiness.job && (readiness.reason === "preflight_queued" || readiness.reason === "preflight_running")) {
          const dispatch = await dispatchApplyPreflightJob(workspaceDir, readiness.job.id, readiness.offer.id);
          if (!dispatch.ok && readiness.reason === "preflight_queued") {
            const message = dispatch.message ?? "Failed to dispatch preflight job";
            await failApplyPreflightDispatch(readiness.offer.id, readiness.job.id, message);
            return Response.json(
              {
                error: message,
                preflightJobId: readiness.job.id,
                offer: {
                  ...readiness.offer,
                  applyReadiness: "blocked",
                  preflightError: message,
                },
                reason: "preflight_dispatch_failed",
              },
              { status: 502 }
            );
          }
        }

        return Response.json(
          {
            offer: readiness.offer,
            preflightJobId: readiness.job?.id ?? null,
            preflightPollUrl: readiness.job ? `/api/preflight-jobs/${readiness.job.id}` : null,
            preflightJob: readiness.job ? await serializePreflightJob(readiness.job) : null,
            reason: readiness.reason,
          },
          { status: readiness.reason === "manual_only" || readiness.reason === "blocked" ? 409 : 202 }
        );
      }
    }

    const queued = await enqueueApplyJob(workspaceDir, {
      offerId: id,
      source: "site",
      llmProvider: "auto",
    });

    const offer = queued.offer;

    if (!queued.job) {
      return Response.json(
        {
          offer,
          applicationId: queued.applicationId,
          reason: queued.reason,
        },
        { status: 200 }
      );
    }

    if (queued.created) {
      const dispatch = await dispatchApplyJob(workspaceDir, queued.job.id, offer.id);
      if (!dispatch.ok) {
        const message = dispatch.message ?? "Failed to dispatch apply job";
        await failApplyDispatch(offer.id, queued.job.id, message);
        return Response.json(
          {
            error: message,
            jobId: queued.job.id,
            offer: { ...offer, status: "apply_failed" },
            reason: "dispatch_failed",
          },
          { status: 502 }
        );
      }
    }

    return Response.json(
      {
        offer: { ...offer, status: "apply_requested" },
        jobId: queued.job.id,
        status: queued.job.status,
        pollUrl: `/api/apply-jobs/${queued.job.id}`,
        job: await serializeApplyJob(queued.job),
        reason: queued.reason,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/offers/[id]/apply error:", error);
    return Response.json({ error: "Failed to trigger apply" }, { status: 500 });
  }
}
