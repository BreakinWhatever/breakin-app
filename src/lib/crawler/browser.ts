import { spawn } from "node:child_process";
import {
  DEFAULT_FINANCE_KEYWORDS,
  cleanText,
  extractCityCountry,
  isLikelyCareerUrl,
  matchesAny,
  normalizeUrl,
  toSearchList,
} from "./filters";
import type { ExtractedJob, HarvestContext } from "./types";

interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

interface BrowserLink {
  url: string;
  title: string;
  text?: string;
}

interface BrowserPayload {
  links?: BrowserLink[];
  pageText?: string;
}

export async function fetchJobsWithDevBrowser(
  context: HarvestContext
): Promise<ExtractedJob[]> {
  const script = buildDevBrowserScript(context.pageUrl);
  const result = await runDevBrowser(script);
  if (result.code !== 0 || !result.stdout.trim()) {
    return [];
  }

  const payload = parsePayload(result.stdout);
  if (!payload) {
    return [];
  }

  const keywords = toSearchList(
    context.request.keywords,
    DEFAULT_FINANCE_KEYWORDS
  );

  const pageText = cleanText(payload.pageText);
  const jobs: ExtractedJob[] = [];
  const seen = new Set<string>();

  for (const link of payload.links ?? []) {
    const url = normalizeUrl(link.url);
    if (!url || seen.has(url) || !isLikelyCareerUrl(url)) continue;
    seen.add(url);

    const title = cleanText(link.title || link.text || "");
    const mergedText = `${title}\n${link.text ?? ""}\n${pageText}`;
    const location = extractCityCountry(mergedText, context.company);
    const hasKeyword = keywords.length === 0 || matchesAny(mergedText, keywords);

    if (!hasKeyword) continue;

    jobs.push({
      url,
      title: title || url,
      description: pageText,
      city: location.city,
      country: location.country,
      sourceDetails: {
        strategy: "dev-browser",
      },
    });
  }

  return jobs;
}

function buildDevBrowserScript(url: string) {
  return `
const page = await browser.newPage();
await page.goto(${JSON.stringify(url)}, { waitUntil: "domcontentloaded", timeout: 25000 });

for (let i = 0; i < 6; i++) {
  const button = page
    .locator('button')
    .filter({ hasText: /load more|see more|show more|voir plus|plus/i })
    .first();
  if (await button.count() === 0) break;
  if (!(await button.isVisible().catch(() => false))) break;
  await button.click().catch(() => {});
  await page.waitForTimeout(1200);
}

const pageText = await page.evaluate(() => document.body?.innerText || "");
const links = await page.evaluate(() => {
  return Array.from(document.querySelectorAll("a[href]"))
    .map((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const title = (anchor.textContent || "").replace(/\\s+/g, " ").trim();
      try {
        return {
          url: new URL(href, location.href).toString(),
          title,
          text: title,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
});

console.log(JSON.stringify({ links, pageText }));
`.trim();
}

function runDevBrowser(script: string): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn("dev-browser", ["--headless", "--timeout", "25"], {
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", () => {
      resolve({ code: null, stdout, stderr });
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });

    child.stdin.write(script);
    child.stdin.end();
  });
}

function parsePayload(stdout: string): BrowserPayload | null {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(stdout.slice(start, end + 1)) as BrowserPayload;
  } catch {
    return null;
  }
}
