import { describe, expect, it, vi } from "vitest";

const prisma = {
  applyJob: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  applyJobEvent: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma,
}));

const mkdir = vi.fn();

vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    mkdir,
  };
});

describe("createApplyJobRecord", () => {
  it("does not touch the filesystem when creating a queued job", async () => {
    const create = prisma.applyJob.create.mockResolvedValue({
      id: "job_123",
      offerId: "offer_123",
    });
    const update = prisma.applyJob.update.mockResolvedValue({
      id: "job_123",
      runtimePath: "/tmp/breakin/.runtime/apply-jobs/job_123",
    });
    const findUnique = prisma.applyJob.findUnique.mockResolvedValue({
      id: "job_123",
      runtimePath: "/tmp/breakin/.runtime/apply-jobs/job_123",
      events: [{ type: "queued" }],
    });
    const eventCreate = prisma.applyJobEvent.create.mockResolvedValue({
      id: "evt_123",
    });
    mkdir.mockReset();

    const { createApplyJobRecord } = await import("@/lib/apply/jobs");

    const job = await createApplyJobRecord("/tmp/breakin", {
      offerId: "offer_123",
      source: "site",
      llmProvider: "auto",
    });

    expect(job).toEqual({
      id: "job_123",
      runtimePath: "/tmp/breakin/.runtime/apply-jobs/job_123",
      events: [{ type: "queued" }],
    });
    expect(create).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith({
      where: { id: "job_123" },
      data: { runtimePath: "/tmp/breakin/.runtime/apply-jobs/job_123" },
    });
    expect(eventCreate).toHaveBeenCalledOnce();
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "job_123" },
      include: {
        offer: true,
        application: true,
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    expect(mkdir).not.toHaveBeenCalled();
  });
});
