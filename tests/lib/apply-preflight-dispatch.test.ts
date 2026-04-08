import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const launchLocalApplyPreflightDispatcher = vi.fn();
const prisma = {
  jobOffer: {
    update: vi.fn(),
  },
};
const updateApplyPreflightJobRecord = vi.fn();

vi.mock("@/lib/apply/preflight-launcher", () => ({
  launchLocalApplyPreflightDispatcher,
}));

vi.mock("@/lib/apply/preflight-jobs", () => ({
  updateApplyPreflightJobRecord,
}));

vi.mock("@/lib/db", () => ({
  prisma,
}));

describe("apply preflight dispatch", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    launchLocalApplyPreflightDispatcher.mockReset();
    updateApplyPreflightJobRecord.mockReset();
    prisma.jobOffer.update.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("defaults to local dispatch outside Vercel", async () => {
    launchLocalApplyPreflightDispatcher.mockResolvedValue({ ok: true, pid: 1234 });
    const { dispatchApplyPreflightJob } = await import("@/lib/apply/preflight-dispatch");

    const result = await dispatchApplyPreflightJob("/tmp/breakin", "pre_123", "offer_123");

    expect(result).toEqual({
      ok: true,
      mode: "local",
      message: "dispatcher pid 1234",
    });
    expect(launchLocalApplyPreflightDispatcher).toHaveBeenCalledWith("/tmp/breakin", "pre_123");
  });

  it("fails remote dispatch when the webhook secret is missing", async () => {
    process.env.VERCEL = "1";
    delete process.env.WEBHOOK_SECRET;

    const { dispatchApplyPreflightJob } = await import("@/lib/apply/preflight-dispatch");
    const result = await dispatchApplyPreflightJob("/tmp/breakin", "pre_123", "offer_123");

    expect(result).toEqual({
      ok: false,
      mode: "remote",
      message: "Missing WEBHOOK_SECRET for remote preflight dispatch",
    });
  });
});
