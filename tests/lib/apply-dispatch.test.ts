import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const launchLocalApplyDispatcher = vi.fn();

vi.mock("@/lib/apply/launcher", () => ({
  launchLocalApplyDispatcher,
}));

vi.mock("@/lib/apply/jobs", () => ({
  appendApplyJobEvent: vi.fn(),
  updateApplyJobRecord: vi.fn(),
}));

describe("apply dispatch", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    launchLocalApplyDispatcher.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("defaults to local dispatch outside Vercel", async () => {
    launchLocalApplyDispatcher.mockResolvedValue({ ok: true, pid: 4321 });
    const { dispatchApplyJob } = await import("@/lib/apply/dispatch");

    const result = await dispatchApplyJob("/tmp/breakin", "job_123", "offer_123");

    expect(result).toEqual({
      ok: true,
      mode: "local",
      message: "dispatcher pid 4321",
    });
    expect(launchLocalApplyDispatcher).toHaveBeenCalledWith("/tmp/breakin", "job_123");
  });

  it("fails remote dispatch when the webhook secret is missing", async () => {
    process.env.VERCEL = "1";
    delete process.env.WEBHOOK_SECRET;

    const { dispatchApplyJob } = await import("@/lib/apply/dispatch");
    const result = await dispatchApplyJob("/tmp/breakin", "job_123", "offer_123");

    expect(result).toEqual({
      ok: false,
      mode: "remote",
      message: "Missing WEBHOOK_SECRET for remote apply dispatch",
    });
  });
});
