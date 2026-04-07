import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import type { JobOffer } from "@/generated/prisma/client";
import type { LlmProvider } from "@/lib/scoring/llm";
import type { ApplyQuestion, CandidateProfile } from "./types";

export async function generateCoverLetter(
  offer: Pick<JobOffer, "title" | "company" | "description" | "city" | "country">,
  profile: CandidateProfile,
  provider: LlmProvider | undefined,
  cwd: string
) {
  const prompt = [
    "Return only the cover letter body.",
    `Language: ${profile.language}.`,
    "Max 140 words. Professional, direct, no placeholders.",
    "",
    JSON.stringify(
      {
        offer: {
          title: offer.title,
          company: offer.company,
          city: offer.city,
          country: offer.country,
          description: offer.description.slice(0, 2500),
        },
        candidate: {
          name: `${profile.firstName} ${profile.lastName}`,
          summary: profile.summary,
        },
      },
      null,
      2
    ),
  ].join("\n");

  const response = await runTextProvider(provider ?? "auto", prompt, cwd);
  if (response?.trim()) {
    return response.trim();
  }

  return profile.language === "fr"
    ? [
        `Bonjour,`,
        "",
        `Je souhaite postuler au poste de ${offer.title} chez ${offer.company}.`,
        `Mon parcours en finance, avec une experience orientee Private Credit, LevFin et M&A, correspond bien au profil recherche.`,
        `Je serais ravi d'echanger avec vous sur ma candidature.`,
        "",
        `Bien cordialement,`,
        `${profile.firstName} ${profile.lastName}`,
      ].join("\n")
    : [
        "Dear Hiring Team,",
        "",
        `I am applying for the ${offer.title} role at ${offer.company}.`,
        "My background in finance, with experience across Private Credit, LevFin and M&A, aligns well with the role.",
        "I would be glad to discuss my application further.",
        "",
        "Best regards,",
        `${profile.firstName} ${profile.lastName}`,
      ].join("\n");
}

export async function answerApplicationQuestion(
  question: ApplyQuestion,
  offer: Pick<JobOffer, "title" | "company" | "description" | "city" | "country">,
  profile: CandidateProfile,
  provider: LlmProvider | undefined,
  cwd: string
) {
  const prompt = [
    "Return JSON only.",
    "Answer this job application question for the candidate using factual, concise, safe wording.",
    "If the answer is not knowable from the candidate profile, answer with an empty string.",
    "Schema: {\"answer\":\"...\"}",
    "",
    JSON.stringify(
      {
        question,
        offer: {
          title: offer.title,
          company: offer.company,
          city: offer.city,
          country: offer.country,
          description: offer.description.slice(0, 2000),
        },
        candidate: {
          name: `${profile.firstName} ${profile.lastName}`,
          location: profile.location,
          phone: profile.phone,
          email: profile.email,
          summary: profile.summary,
          education: profile.education,
          experience: profile.experience,
          skills: profile.skills,
          languages: profile.languages,
          linkedinUrl: profile.linkedinUrl ?? "",
        },
      },
      null,
      2
    ),
  ].join("\n");

  const response = await runTextProvider(provider ?? "auto", prompt, cwd);
  const parsed = parseJsonObject(response);
  if (parsed && typeof parsed.answer === "string") {
    return parsed.answer.trim();
  }

  return "";
}

function resolveProviders(provider: LlmProvider | undefined) {
  if (provider === "none") return [] as Array<"claude" | "codex">;
  if (provider === "claude") return ["claude"] as Array<"claude" | "codex">;
  if (provider === "codex") return ["codex"] as Array<"claude" | "codex">;

  const resolved: Array<"claude" | "codex"> = [];
  if (binaryExists("claude")) resolved.push("claude");
  if (binaryExists("codex")) resolved.push("codex");
  return resolved;
}

async function runTextProvider(
  provider: LlmProvider | undefined,
  prompt: string,
  cwd: string
) {
  const providers = resolveProviders(provider);
  for (const current of providers) {
    const value = current === "claude"
      ? await runClaude(prompt, cwd)
      : await runCodex(prompt, cwd);
    if (value?.trim()) return value.trim();
  }
  return null;
}

function runClaude(prompt: string, cwd: string) {
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
    }, Number(process.env.CLAUDE_TIMEOUT_MS ?? 90_000));

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
      resolve(stdout.trim() || stderr.trim() || null);
    });
  });
}

async function runCodex(prompt: string, cwd: string) {
  const tempDir = await mkdtemp(path.join(tmpdir(), "breakin-apply-llm-"));
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

    await new Promise<void>((resolve) => {
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
        resolve();
      }, Number(process.env.CODEX_TIMEOUT_MS ?? 120_000));

      child.on("error", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });

      child.on("close", () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      });
    });

    try {
      const text = await readFile(outputFile, "utf8");
      return text.trim() || null;
    } catch {
      return null;
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function binaryExists(bin: string) {
  const result = spawnSync("bash", ["-lc", `command -v ${bin}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function parseJsonObject(value: string | null) {
  if (!value) return null;
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(value.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
