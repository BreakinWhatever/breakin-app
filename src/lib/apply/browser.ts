import { spawn } from "node:child_process";
import type { BrowserRunInput, BrowserRunResult, ApplyPlatform } from "./types";

interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

const PLATFORM_PATTERNS: Array<[RegExp, ApplyPlatform]> = [
  [/myworkdayjobs\.com/i, "workday"],
  [/greenhouse\.io/i, "greenhouse"],
  [/lever\.co/i, "lever"],
  [/smartrecruiters\.com/i, "smartrecruiters"],
  [/taleo\.net|tbe\.taleo/i, "taleo"],
  [/workable\.com/i, "workable"],
  [/ashbyhq\.com/i, "ashby"],
];

export function detectApplyPlatform(url: string): ApplyPlatform {
  for (const [pattern, platform] of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return platform;
  }
  return "generic";
}

export async function runApplyWithDevBrowser(
  input: BrowserRunInput
): Promise<BrowserRunResult> {
  const script = buildApplyScript(input);
  const result = await runDevBrowser(script);
  const parsed = parseBrowserResult(result.stdout);

  if (parsed) {
    return parsed;
  }

  const tail = `${result.stdout}\n${result.stderr}`.trim().slice(-1200);
  return {
    status: "failed",
    message: tail || "dev-browser did not return structured output",
    currentUrl: null,
    pageTextSnippet: tail || null,
    screenshotPath: input.screenshotPath,
  };
}

function buildApplyScript(input: BrowserRunInput) {
  const payload = JSON.stringify(input);

  return `
const payload = ${payload};
const page = await browser.newPage();

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\\w\\s]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function buildRegex(patterns) {
  return patterns.map((pattern) => new RegExp(pattern, "i"));
}

async function clickByPatterns(patterns) {
  return page.evaluate((rawPatterns) => {
    const regexes = rawPatterns.map((pattern) => new RegExp(pattern, "i"));
    const elements = Array.from(
      document.querySelectorAll("button, a, input[type=button], input[type=submit], [role=button]")
    );

    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    for (const element of elements) {
      if (!visible(element)) continue;
      const text = [element.textContent || "", element.getAttribute("aria-label") || "", element.getAttribute("value") || ""]
        .join(" ")
        .trim();
      if (!text) continue;
      if (!regexes.some((regex) => regex.test(text))) continue;
      element.click();
      return true;
    }

    return false;
  }, patterns);
}

async function waitForSettled(ms = 1500) {
  await page.waitForTimeout(ms);
}

async function fillPatterns(patterns, value) {
  if (!value) return false;
  return page.evaluate(({ rawPatterns, rawValue }) => {
    const regexes = rawPatterns.map((pattern) => new RegExp(pattern, "i"));
    const value = String(rawValue);

    function normalizeLocal(input) {
      return String(input || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\\w\\s]/g, " ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    function labelFor(element) {
      const aria = element.getAttribute("aria-label") || "";
      const placeholder = element.getAttribute("placeholder") || "";
      const name = element.getAttribute("name") || "";
      const id = element.id || "";
      const labelledBy = element.getAttribute("aria-labelledby") || "";
      const label = element.labels && element.labels[0] ? element.labels[0].innerText : "";
      const parentLabel = element.closest("label") ? element.closest("label").innerText : "";
      const heading = element.closest("fieldset") ? element.closest("fieldset").innerText : "";
      return [label, parentLabel, aria, placeholder, name, id, labelledBy, heading]
        .join(" ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    const elements = Array.from(document.querySelectorAll("input, textarea, select"));
    for (const element of elements) {
      if (!(element instanceof HTMLElement)) continue;
      if (!visible(element) || element.hasAttribute("disabled")) continue;
      const type = (element.getAttribute("type") || "").toLowerCase();
      if (type === "hidden" || type === "file") continue;
      const label = labelFor(element);
      if (!regexes.some((regex) => regex.test(label))) continue;

      if (element instanceof HTMLSelectElement) {
        const normalizedValue = normalizeLocal(value);
        let matched = false;
        for (const option of Array.from(element.options)) {
          if (normalizeLocal(option.textContent || option.value).includes(normalizedValue)) {
            element.value = option.value;
            matched = true;
            break;
          }
        }
        if (!matched) {
          const fallback = Array.from(element.options).find((option) => option.value);
          if (fallback) element.value = fallback.value;
        }
        element.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      if (type === "checkbox") {
        const shouldCheck = /^(1|true|yes|oui)$/i.test(value);
        if (element.checked !== shouldCheck) {
          element.click();
        }
        return true;
      }

      if (type === "radio") {
        element.click();
        return true;
      }

      element.focus();
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.blur();
      return true;
    }

    return false;
  }, { rawPatterns: patterns, rawValue: value });
}

async function uploadCv() {
  try {
    const locator = page.locator("input[type=file]").first();
    const count = await locator.count();
    if (count === 0) return false;
    await locator.setInputFiles(payload.profile.cvPath);
    await waitForSettled(1500);
    return true;
  } catch {
    return false;
  }
}

async function maybeFillVerificationCode() {
  if (!payload.verificationCode) return false;
  return fillPatterns([
    "verification code",
    "security code",
    "code",
    "otp",
    "confirmation code",
  ], payload.verificationCode);
}

async function fillCoreFields() {
  await fillPatterns(["first name", "prenom", "prénom", "given name"], payload.profile.firstName);
  await fillPatterns(["last name", "surname", "nom", "family name"], payload.profile.lastName);
  await fillPatterns(["full name", "name"], payload.profile.firstName + " " + payload.profile.lastName);
  await fillPatterns(["email", "e-mail"], payload.profile.email);
  await fillPatterns(["phone", "telephone", "téléphone", "mobile"], payload.profile.phone);
  await fillPatterns(["city"], payload.profile.location);
  await fillPatterns(["linkedin"], payload.profile.linkedinUrl || "");
  await fillPatterns(["website", "portfolio"], "");
  await fillPatterns(["salary", "compensation"], "Open to discuss based on the role and market standards.");
  await fillPatterns(["available start", "start date", "availability", "disponibilite", "disponibilité"], "Available as soon as required.");
  await fillPatterns(["cover letter", "motivation", "why are you interested", "pourquoi"], payload.coverLetter);
}

async function fillExtraAnswers() {
  for (const answer of payload.extraAnswers || []) {
    await fillPatterns([
      answer.label,
      answer.questionKey,
    ], answer.answer);
  }
}

async function maybeCreateOrLogin() {
  if (!payload.profile.accountPassword) return false;
  const clicked = await clickByPatterns([
    "create account",
    "create profile",
    "register",
    "sign up",
    "s'inscrire",
    "creer un compte",
  ]);
  if (clicked) {
    await waitForSettled(1500);
  }

  const passwordFilled = await fillPatterns(["password", "mot de passe"], payload.profile.accountPassword);
  const confirmFilled = await fillPatterns([
    "confirm password",
    "confirm your password",
    "confirmer le mot de passe",
  ], payload.profile.accountPassword);

  if (passwordFilled || confirmFilled) {
    await clickByPatterns([
      "continue",
      "create account",
      "register",
      "sign up",
      "next",
      "log in",
      "login",
      "sign in",
    ]);
    await waitForSettled(2000);
    return true;
  }

  return clicked;
}

async function extractBodyText() {
  return page.evaluate(() => (document.body?.innerText || "").replace(/\\s+/g, " ").trim());
}

async function collectPendingQuestions() {
  return page.evaluate(() => {
    function normalize(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\\w\\s]/g, " ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    function labelFor(element) {
      const aria = element.getAttribute("aria-label") || "";
      const placeholder = element.getAttribute("placeholder") || "";
      const name = element.getAttribute("name") || "";
      const id = element.id || "";
      const label = element.labels && element.labels[0] ? element.labels[0].innerText : "";
      const parentLabel = element.closest("label") ? element.closest("label").innerText : "";
      const fieldset = element.closest("fieldset") ? element.closest("fieldset").innerText : "";
      return [label, parentLabel, aria, placeholder, name, id, fieldset]
        .join(" ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    const questions = [];
    const elements = Array.from(document.querySelectorAll("input, textarea, select"));
    for (const element of elements) {
      if (!(element instanceof HTMLElement)) continue;
      if (!visible(element) || element.hasAttribute("disabled")) continue;
      const type = (element.getAttribute("type") || "").toLowerCase();
      if (type === "hidden" || type === "file" || type === "submit" || type === "button") continue;

      const required =
        element.hasAttribute("required")
        || element.getAttribute("aria-required") === "true"
        || element.closest("[aria-required=true]") !== null;
      if (!required) continue;

      const label = labelFor(element);
      const key = normalize(label);
      if (!key) continue;

      let empty = false;
      let options = [];

      if (element instanceof HTMLSelectElement) {
        empty = !element.value;
        options = Array.from(element.options)
          .map((option) => option.textContent?.trim() || option.value)
          .filter(Boolean);
      } else if (type === "radio") {
        const radios = Array.from(document.querySelectorAll('input[type="radio"][name="' + CSS.escape(element.getAttribute("name") || "") + '"]'));
        const checked = radios.find((radio) => radio.checked);
        empty = !checked;
        options = radios
          .map((radio) => {
            const labelEl = radio.closest("label");
            return (labelEl?.innerText || radio.getAttribute("value") || "").trim();
          })
          .filter(Boolean);
      } else if (type === "checkbox") {
        empty = !(element).checked;
      } else {
        empty = !(element).value;
      }

      if (!empty) continue;

      questions.push({
        key,
        label,
        type: element instanceof HTMLTextAreaElement
          ? "textarea"
          : element instanceof HTMLSelectElement
            ? "select"
            : type === "radio"
              ? "radio"
              : "text",
        required: true,
        options,
      });
    }

    return questions.slice(0, 12);
  });
}

async function capture(status, message, questions) {
  const text = await extractBodyText();
  try {
    await page.screenshot({ path: payload.screenshotPath, fullPage: true });
  } catch {}

  const result = {
    status,
    message,
    currentUrl: page.url(),
    pageTextSnippet: text.slice(0, 1500),
    questions: questions || [],
    screenshotPath: payload.screenshotPath,
    successSignal: /thank|merci|submitted|application received|candidature a bien ete envoyee|we have received/i.test(text)
      ? "success_text"
      : null,
  };
  console.log(JSON.stringify(result));
}

async function successDetected() {
  const text = await extractBodyText();
  return /thank|merci|submitted|application received|candidature a bien ete envoyee|we have received/i.test(text);
}

async function verificationRequested() {
  const text = await extractBodyText();
  return /verify your email|check your email|confirmation email|enter.*code|verification code|confirm your email/i.test(text);
}

async function platformPrelude() {
  if (payload.verificationLink) {
    const verificationPage = await browser.newPage();
    await verificationPage.goto(payload.verificationLink, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await verificationPage.waitForTimeout(3000).catch(() => {});
    await verificationPage.close().catch(() => {});
  }

  await page.goto(payload.url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForSettled(2500);

  if (payload.platform === "workday") {
    await clickByPatterns(["apply", "postuler"]);
    await waitForSettled(1500);
    await clickByPatterns(["apply as guest", "guest", "continue as guest", "invite"]);
    await waitForSettled(1500);
    return;
  }

  if (payload.platform === "smartrecruiters" || payload.platform === "taleo") {
    await clickByPatterns(["apply", "postuler"]);
    await waitForSettled(2000);
    await clickByPatterns(["guest", "invite"]);
    await waitForSettled(1500);
    return;
  }

  await clickByPatterns(["apply", "postuler", "apply now", "submit application"]);
  await waitForSettled(1500);
}

await platformPrelude();
await maybeCreateOrLogin();
await maybeFillVerificationCode();
await fillCoreFields();
await uploadCv();
await fillExtraAnswers();

for (let step = 0; step < 8; step += 1) {
  if (await successDetected()) {
    await capture("submitted", "Application submitted", []);
    return;
  }

  if (await verificationRequested()) {
    await capture("needs_email_verification", "Email verification requested", []);
    return;
  }

  const pending = await collectPendingQuestions();
  if (pending.length > 0) {
    await capture("needs_answers", "Additional required answers detected", pending);
    return;
  }

  const advanced = await clickByPatterns([
    "submit",
    "send application",
    "envoyer",
    "soumettre",
    "apply now",
    "continue",
    "next",
    "suivant",
    "review",
  ]);

  if (!advanced) {
    break;
  }

  await waitForSettled(2200);
  await maybeFillVerificationCode();
  await fillCoreFields();
  await uploadCv();
  await fillExtraAnswers();
}

if (await successDetected()) {
  await capture("submitted", "Application submitted", []);
  return;
}

if (await verificationRequested()) {
  await capture("needs_email_verification", "Email verification requested", []);
  return;
}

const pending = await collectPendingQuestions();
if (pending.length > 0) {
  await capture("needs_answers", "Additional required answers detected", pending);
  return;
}

await capture("manual_review", "Browser flow ended without a clear success signal", []);
`.trim();
}

function runDevBrowser(script: string): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = spawn("dev-browser", ["--headless", "--timeout", "180"], {
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

function parseBrowserResult(stdout: string) {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();

  for (const line of lines) {
    if (!line.startsWith("{") || !line.endsWith("}")) continue;
    try {
      return JSON.parse(line) as BrowserRunResult;
    } catch {
      continue;
    }
  }

  return null;
}
