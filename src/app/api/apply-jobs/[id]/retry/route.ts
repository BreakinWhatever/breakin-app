import { NextRequest } from "next/server";
import { retryApplyJob } from "@/lib/apply/service";
import { createHmac } from "crypto";

const VPS_WEBHOOK = "http://46.225.210.206:9000/hooks/apply-offer";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

async function triggerVPSApply(jobId: string, offerId: string) {
  const payload = JSON.stringify({ job_id: jobId, offer_id: offerId });
  const sig = createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  await fetch(VPS_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": `sha256=${sig}`,
    },
    body: payload,
  }).catch(() => {});
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queued = await retryApplyJob(process.cwd(), id);

    if (!queued.job) {
      return Response.json(
        { error: "Retry did not create a new apply job" },
        { status: 409 }
      );
    }

    await triggerVPSApply(queued.job.id, queued.offer.id);

    return Response.json(
      {
        jobId: queued.job.id,
        status: queued.job.status,
        pollUrl: `/api/apply-jobs/${queued.job.id}`,
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
