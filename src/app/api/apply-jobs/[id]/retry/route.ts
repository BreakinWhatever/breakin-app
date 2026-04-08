import { NextRequest } from "next/server";
import { isApplyPreflightEnabled } from "@/lib/apply/config";
import { serializePreflightJob, serializeApplyJob } from "@/lib/apply/payloads";
import { readApplyJobRecord } from "@/lib/apply/jobs";
import { ensureOfferApplyReady } from "@/lib/apply/preflight";
import {
  dispatchApplyPreflightJob,
  failApplyPreflightDispatch,
} from "@/lib/apply/preflight-dispatch";
import { retryApplyJob } from "@/lib/apply/service";
import { dispatchApplyJob, failApplyDispatch } from "@/lib/apply/dispatch";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceDir = process.cwd();
    const previous = await readApplyJobRecord(id);
    if (!previous) {
      return Response.json(
        { error: "Apply job not found" },
        { status: 404 }
      );
    }

    if (isApplyPreflightEnabled()) {
      const readiness = await ensureOfferApplyReady(workspaceDir, {
        offerId: previous.offerId,
        source: "retry",
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
                reason: "preflight_dispatch_failed",
              },
              { status: 502 }
            );
          }
        }

        return Response.json(
          {
            preflightJobId: readiness.job?.id ?? null,
            preflightPollUrl: readiness.job ? `/api/preflight-jobs/${readiness.job.id}` : null,
            preflightJob: readiness.job ? await serializePreflightJob(readiness.job) : null,
            reason: readiness.reason,
          },
          { status: readiness.reason === "manual_only" || readiness.reason === "blocked" ? 409 : 202 }
        );
      }
    }

    const queued = await retryApplyJob(workspaceDir, id);

    if (!queued.job) {
      return Response.json(
        { error: "Retry did not create a new apply job" },
        { status: 409 }
      );
    }

    const dispatch = await dispatchApplyJob(workspaceDir, queued.job.id, queued.offer.id);
    if (!dispatch.ok) {
      const message = dispatch.message ?? "Failed to dispatch apply job";
      await failApplyDispatch(queued.offer.id, queued.job.id, message);
      return Response.json(
        {
          error: message,
          jobId: queued.job.id,
          reason: "dispatch_failed",
        },
        { status: 502 }
      );
    }

    return Response.json(
      {
        jobId: queued.job.id,
        status: queued.job.status,
        pollUrl: `/api/apply-jobs/${queued.job.id}`,
        job: await serializeApplyJob(queued.job),
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/apply-jobs/[id]/retry error:", error);
    return Response.json(
      { error: "Failed to retry apply job" },
      { status: 500 }
    );
  }
}
