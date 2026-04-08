import { NextRequest } from "next/server";
import { serializePreflightJob } from "@/lib/apply/payloads";
import { enqueueApplyPreflightJob } from "@/lib/apply/preflight";
import {
  dispatchApplyPreflightJob,
  failApplyPreflightDispatch,
} from "@/lib/apply/preflight-dispatch";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceDir = process.cwd();
    const queued = await enqueueApplyPreflightJob(workspaceDir, {
      offerId: id,
      source: "site",
    });

    if (!queued.job) {
      return Response.json(
        { error: "Failed to create preflight job" },
        { status: 500 }
      );
    }

    if (queued.created) {
      const dispatch = await dispatchApplyPreflightJob(workspaceDir, queued.job.id, queued.offer.id);
      if (!dispatch.ok) {
        const message = dispatch.message ?? "Failed to dispatch preflight job";
        await failApplyPreflightDispatch(queued.offer.id, queued.job.id, message);
        return Response.json(
          {
            error: message,
            preflightJobId: queued.job.id,
            reason: "dispatch_failed",
          },
          { status: 502 }
        );
      }
    }

    return Response.json(
      {
        preflightJobId: queued.job.id,
        status: queued.job.status,
        pollUrl: `/api/preflight-jobs/${queued.job.id}`,
        job: await serializePreflightJob(queued.job),
        reason: queued.reason,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST /api/offers/[id]/preflight error:", error);
    return Response.json(
      { error: "Failed to trigger apply preflight" },
      { status: 500 }
    );
  }
}
