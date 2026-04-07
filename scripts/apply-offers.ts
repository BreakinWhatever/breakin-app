import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const { parseApplyCliArgs, formatApplySummaryForStdout } = await import("../src/lib/apply/cli");
  const { enqueueApplyJob, retryApplyJob } = await import("../src/lib/apply/service");
  const { launchLocalApplyDispatcher } = await import("../src/lib/apply/launcher");
  const { listApplyJobRecords, readApplyJobRecord } = await import("../src/lib/apply/jobs");

  const command = parseApplyCliArgs(process.argv.slice(2));

  if (command.type === "status") {
    const job = await readApplyJobRecord(command.jobId);
    if (!job) {
      throw new Error(`Apply job not found: ${command.jobId}`);
    }
    process.stdout.write(`${JSON.stringify(job, null, 2)}\n`);
    return;
  }

  if (command.type === "jobs") {
    const jobs = await listApplyJobRecords({
      status: command.status,
      limit: 20,
    });
    process.stdout.write(`${JSON.stringify(jobs, null, 2)}\n`);
    return;
  }

  if (command.type === "retry") {
    const retried = await retryApplyJob(process.cwd(), command.jobId);
    if (!retried.job) {
      throw new Error("Retry failed to create a new job.");
    }
    await launchLocalApplyDispatcher(process.cwd(), retried.job.id);
    process.stdout.write(`${JSON.stringify({ jobId: retried.job.id, status: retried.job.status }, null, 2)}\n`);
    return;
  }

  const queued = await enqueueApplyJob(process.cwd(), command.request);
  if (!queued.job) {
    process.stdout.write(
      `${JSON.stringify({
        created: queued.created,
        reason: queued.reason,
        applicationId: queued.applicationId,
      }, null, 2)}\n`
    );
    return;
  }

  if (queued.created) {
    await launchLocalApplyDispatcher(process.cwd(), queued.job.id);
  }
  process.stdout.write(
    `${formatApplySummaryForStdout({
      jobId: queued.job.id,
      status: queued.job.status,
      source: queued.job.source,
      offerId: queued.offer.id,
      created: queued.created,
    })}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
