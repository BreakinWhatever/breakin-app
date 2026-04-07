import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import { detectContractType } from "@/lib/offers";
import type { OfferLike, ScoreResult } from "./core";

export type LlmProvider = "auto" | "none" | "claude" | "codex";

export interface LlmOfferAssessment {
  relevant: boolean;
  score: number;
  rationale: string;
  contractType: string | null;
}

export interface LlmAssessmentOptions {
  provider: LlmProvider;
  cwd: string;
  maxOffers: number;
  currentIndex: number;
}

export async function assessOfferWithLlm(
  offer: OfferLike,
  baseScore: ScoreResult,
  options: LlmAssessmentOptions
): Promise<LlmOfferAssessment | null> {
  if (!shouldUseLlmForOffer(baseScore, options)) {
    return null;
  }

  const providers = resolveProviders(options.provider);
  if (providers.length === 0) return null;

  const prompt = buildAssessmentPrompt(offer, baseScore);
  for (const provider of providers) {
    const response = await runProvider(provider, prompt, options.cwd);
    if (!response) continue;

    const parsed = parseJsonObject(response);
    if (!parsed) continue;

    const relevant = Boolean(parsed.relevant ?? true);
    const score = clampScore(Number(parsed.score ?? baseScore.score));
    const rationale =
      typeof parsed.rationale === "string" && parsed.rationale.trim()
        ? parsed.rationale.trim()
        : baseScore.rationale;
    const contractType =
      typeof parsed.contractType === "string" && parsed.contractType.trim()
        ? parsed.contractType.trim()
        : detectContractType(offer.title, offer.description ?? "");

    return {
      relevant,
      score,
      rationale,
      contractType,
    };
  }

  return null;
}

export function mergeScores(
  baseScore: ScoreResult,
  llmAssessment: LlmOfferAssessment | null
) {
  if (!llmAssessment) {
    return {
      score: baseScore.score,
      rationale: baseScore.rationale,
      contractType: null as string | null,
      llmUsed: false,
    };
  }

  const weighted = Math.round(baseScore.score * 0.7 + llmAssessment.score * 0.3);
  const score = llmAssessment.relevant ? weighted : Math.min(weighted, 25);

  return {
    score,
    rationale: llmAssessment.rationale || baseScore.rationale,
    contractType: llmAssessment.contractType,
    llmUsed: true,
  };
}

function shouldUseLlmForOffer(
  baseScore: ScoreResult,
  options: Pick<LlmAssessmentOptions, "provider" | "maxOffers" | "currentIndex">
) {
  if (options.provider === "none") return false;
  if (options.currentIndex >= options.maxOffers) return false;
  return baseScore.score >= 15 && baseScore.score <= 85;
}

function resolveProviders(provider: LlmProvider) {
  if (provider === "none") return [] as Array<"claude" | "codex">;
  if (provider === "claude") return ["claude"] as Array<"claude" | "codex">;
  if (provider === "codex") return ["codex"] as Array<"claude" | "codex">;

  const ordered: Array<"claude" | "codex"> = [];
  if (binaryExists("claude")) ordered.push("claude");
  if (binaryExists("codex")) ordered.push("codex");
  return ordered;
}

function buildAssessmentPrompt(offer: OfferLike, baseScore: ScoreResult) {
  return [
    "Return JSON only.",
    "Assess this finance job offer for a candidate targeting Private Credit, LevFin, M&A, Transaction Services, and related analyst/off-cycle roles.",
    "Be strict. Roles in operations, governance, controls, reporting, product strategy, client service, platform support, accounting, tax, legal, compliance, engineering, technology, middle office, or risk should usually be marked relevant=false unless the title clearly points to direct investing, underwriting, lending, deal execution, restructuring, or transaction advisory work.",
    "Do not reward a role just because it is at Analyst/Associate level or in London/Paris.",
    "Fields required: relevant(boolean), score(number 0..100), rationale(string), contractType(string|null).",
    "Keep the rationale short and factual.",
    "",
    JSON.stringify(
      {
        offer: {
          title: offer.title,
          city: offer.city ?? "",
          country: offer.country ?? "",
          postedAt: offer.postedAt ?? null,
          description: (offer.description ?? "").slice(0, 3500),
        },
        baseScore,
      },
      null,
      2
    ),
  ].join("\n");
}

async function runProvider(
  provider: "claude" | "codex",
  prompt: string,
  cwd: string
) {
  if (provider === "claude") {
    return runClaude(prompt, cwd);
  }
  return runCodex(prompt, cwd);
}

async function runClaude(prompt: string, cwd: string) {
  return new Promise<string | null>((resolve) => {
    const args = ["-p", prompt];
    if (process.env.CLAUDE_MODEL) {
      args.unshift("--model", process.env.CLAUDE_MODEL);
    }

    const child = spawn("claude", args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      resolve(null);
    }, Number(process.env.CLAUDE_TIMEOUT_MS ?? 60_000));

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(null);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim());
        return;
      }
      if (stdout.trim()) {
        resolve(stdout.trim());
        return;
      }
      resolve(stderr.trim() || null);
    });
  });
}

async function runCodex(prompt: string, cwd: string) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "breakin-score-"));
  const outputFile = path.join(tempDir, "last-message.txt");

  try {
    const args = [
      "exec",
      "--full-auto",
      "-C",
      cwd,
      "--output-last-message",
      outputFile,
      "--color",
      "never",
    ];

    if (process.env.CODEX_MODEL) {
      args.push("-m", process.env.CODEX_MODEL);
    }
    args.push(prompt);

    const output = await new Promise<string | null>((resolve) => {
      const child = spawn("codex", args, {
        cwd,
        env: process.env,
        stdio: ["ignore", "ignore", "ignore"],
      });

      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGTERM");
        resolve(null);
      }, Number(process.env.CODEX_TIMEOUT_MS ?? 90_000));

      child.on("error", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      });
      child.on("close", async (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          resolve(null);
          return;
        }

        try {
          resolve((await readFile(outputFile, "utf8")).trim() || null);
        } catch {
          resolve(null);
        }
      });
    });

    return output;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function parseJsonObject(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function binaryExists(command: string) {
  const result = spawnSync("bash", ["-lc", `command -v ${command} >/dev/null 2>&1`], {
    stdio: "ignore",
  });
  return result.status === 0;
}
