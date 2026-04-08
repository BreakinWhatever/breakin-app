#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const wikiRoot = process.env.BREAKIN_WIKI_DIR || "/Users/ousmane/wiki/wiki";

async function main() {
  const progress = await fs.readFile(path.join(repoRoot, "ops/PROGRESS.md"), "utf8");
  const systemMap = await fs.readFile(path.join(repoRoot, "ops/system-map.md"), "utf8");

  const hotFile = path.join(wikiRoot, "hot-Candidatures.md");
  const mirrorFile = path.join(wikiRoot, "breakin-ops.md");

  const hotContent = await fs.readFile(hotFile, "utf8");
  const stamp = `\n## ${new Date().toISOString().slice(0, 10)} — Ops mirror\n\n- Canonical ops state now lives in repo ` +
    "`ops/`" +
    "\n- Sync script: `scripts/sync-ops-to-wiki.mjs`\n";

  if (!hotContent.includes("Canonical ops state now lives in repo `ops/`")) {
    await fs.writeFile(hotFile, `${hotContent.trimEnd()}\n${stamp}`);
  }

  const mirror = [
    "# BreakIn Ops Mirror",
    "",
    "> Canonical source: repo `ops/`. This wiki page mirrors the durable entrypoints only.",
    "",
    "## Progress",
    "",
    progress.trim(),
    "",
    "## System Map",
    "",
    systemMap.trim(),
    "",
  ].join("\n");

  await fs.writeFile(mirrorFile, `${mirror.trimEnd()}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
