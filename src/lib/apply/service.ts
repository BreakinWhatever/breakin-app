import { prisma } from "@/lib/db";
import { normalizeUrl } from "@/lib/crawler/filters";
import {
  createApplyJobRecord,
  findActiveApplyJobForOffer,
  readApplyJobRecord,
} from "./jobs";
import type { ApplyRequest } from "./types";

export async function resolveOfferFromInput(offerIdOrUrl: string) {
  const normalized = normalizeUrl(offerIdOrUrl);

  if (normalized?.startsWith("http")) {
    return prisma.jobOffer.findUnique({
      where: { url: normalized },
    });
  }

  return prisma.jobOffer.findUnique({
    where: { id: offerIdOrUrl },
  });
}

export async function enqueueApplyJob(
  workspaceDir: string,
  request: ApplyRequest
) {
  const offer = await resolveOfferFromInput(request.offerId);
  if (!offer) {
    throw new Error("Offer not found");
  }

  if (offer.status === "applied") {
    const existing = await prisma.application.findFirst({
      where: { offerId: offer.id },
    });
    return {
      created: false,
      offer,
      job: null,
      applicationId: existing?.id ?? null,
      reason: "already_applied",
    } as const;
  }

  const active = await findActiveApplyJobForOffer(offer.id);
  if (active) {
    return {
      created: false,
      offer,
      job: active,
      applicationId: active.applicationId,
      reason: "already_running",
    } as const;
  }

  await prisma.jobOffer.update({
    where: { id: offer.id },
    data: { status: "apply_requested" },
  });

  const job = await createApplyJobRecord(workspaceDir, {
    ...request,
    offerId: offer.id,
  });
  if (!job) {
    throw new Error("Failed to create apply job");
  }

  return {
    created: true,
    offer,
    job,
    applicationId: null,
    reason: "created",
  } as const;
}

export async function retryApplyJob(workspaceDir: string, previousJobId: string) {
  const previous = await readApplyJobRecord(previousJobId);
  if (!previous) {
    throw new Error("Apply job not found");
  }

  return enqueueApplyJob(workspaceDir, {
    offerId: previous.offerId,
    source: "retry",
    force: true,
    llmProvider: readRequestedLlmProvider(previous.input),
  });
}

function readRequestedLlmProvider(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const value = Reflect.get(input, "llmProvider");
  if (value === "auto" || value === "none" || value === "claude" || value === "codex") {
    return value;
  }
  return undefined;
}
