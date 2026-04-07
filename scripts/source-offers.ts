import { loadEnvConfig } from "@next/env";
import { formatSearchSummaryForStdout, parseSearchCliArgs } from "../src/lib/sourcing/cli";

async function main() {
  loadEnvConfig(process.cwd());
  process.env.CRAWLEE_LOG_LEVEL ??= "ERROR";

  const input = parseSearchCliArgs(process.argv.slice(2), process.cwd());
  const { runOfferSearch } = await import("../src/lib/sourcing/engine");
  const summary = await runOfferSearch(input);
  process.stdout.write(`${formatSearchSummaryForStdout(summary)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
