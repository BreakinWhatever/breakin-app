import { spawn } from "node:child_process";
import type {
  ApplyExecutionPlan,
  ApplyPreflightObservation,
  BrowserRunInput,
  BrowserRunResult,
} from "./types";

interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export async function runApplyPreflightWithDevBrowser(input: {
  url: string;
  platform: BrowserRunInput["platform"];
  plan: ApplyExecutionPlan;
}): Promise<ApplyPreflightObservation | null> {
  const script = buildPreflightScript(input);
  const result = await runBrowserScript(script);
  return parseJsonLine<ApplyPreflightObservation>(result.stdout);
}

export async function runApplyPlanWithDevBrowser(
  input: BrowserRunInput & { plan: ApplyExecutionPlan }
): Promise<BrowserRunResult> {
  const script = buildApplyPlanScript(input);
  const result = await runBrowserScript(script);
  const parsed = parseJsonLine<BrowserRunResult>(result.stdout);

  if (parsed) return parsed;

  const tail = `${result.stdout}\n${result.stderr}`.trim().slice(-1200);
  return {
    status: "failed",
    message: tail || "dev-browser did not return structured output",
    currentUrl: null,
    pageTextSnippet: tail || null,
    screenshotPath: input.screenshotPath,
  };
}

function runBrowserScript(script: string): Promise<CliResult> {
  return runDevBrowser(script);
}

function buildPreflightScript(input: {
  url: string;
  platform: BrowserRunInput["platform"];
  plan: ApplyExecutionPlan;
}) {
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

function uniq(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function visible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

async function waitForSettled(ms = 1200) {
  await page.waitForTimeout(ms);
}

async function clickByHints(hints) {
  for (const hint of hints || []) {
    const regex = new RegExp(hint.replace(/[.*+?^$()|[\\]\\\\{}]/g, "\\\\$&"), "i");
    const button = page.getByRole("button", { name: regex }).first();
    if (await button.count().catch(() => 0)) {
      if (await button.isVisible().catch(() => false)) {
        await button.click().catch(() => {});
        return true;
      }
    }

    const link = page.getByRole("link", { name: regex }).first();
    if (await link.count().catch(() => 0)) {
      if (await link.isVisible().catch(() => false)) {
        await link.click().catch(() => {});
        return true;
      }
    }

    const text = page.getByText(regex).first();
    if (await text.count().catch(() => 0)) {
      if (await text.isVisible().catch(() => false)) {
        await text.click().catch(() => {});
        return true;
      }
    }
  }
  return false;
}

async function clickButtonByHints(hints) {
  for (const hint of hints || []) {
    const regex = new RegExp(escapeRegex(hint), "i");
    const button = await firstVisible(page.getByRole("button", { name: regex }));
    if (!button) continue;
    await button.click().catch(() => {});
    return true;
  }
  return false;
}

function fieldLabel(element) {
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

async function collectObservation() {
  return page.evaluate(({ flowKey }) => {
    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    function normalize(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\\w\\s]/g, " ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    function fieldLabel(element) {
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

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .filter((element) => visible(element))
      .map((element) => element.textContent?.trim() || "")
      .filter(Boolean)
      .slice(0, 10);

    const buttonTexts = Array.from(document.querySelectorAll("button, a, [role=button], input[type=submit], input[type=button]"))
      .filter((element) => visible(element))
      .map((element) => [element.textContent || "", element.getAttribute("aria-label") || "", element.getAttribute("value") || ""].join(" ").trim())
      .filter(Boolean)
      .slice(0, 40);

    const fieldLabels = Array.from(document.querySelectorAll("input, textarea, select"))
      .filter((element) => visible(element) && !element.disabled)
      .map((element) => fieldLabel(element))
      .filter(Boolean)
      .slice(0, 80);

    const requiredQuestions = Array.from(document.querySelectorAll("input, textarea, select"))
      .filter((element) => visible(element) && !element.disabled)
      .map((element) => {
        const type = (element.getAttribute("type") || "").toLowerCase();
        if (type === "hidden" || type === "file" || type === "submit" || type === "button") return null;
        const required =
          element.hasAttribute("required")
          || element.getAttribute("aria-required") === "true"
          || element.closest("[aria-required=true]") !== null;
        if (!required) return null;
        const label = fieldLabel(element);
        if (!label) return null;
        const options = element instanceof HTMLSelectElement
          ? Array.from(element.options).map((option) => option.textContent?.trim() || option.value).filter(Boolean)
          : [];
        return {
          key: normalize(label),
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
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    const authSignals = uniq([
      ...Array.from(document.querySelectorAll("input[type=password]")).map(() => "password"),
      ...Array.from(document.querySelectorAll("*")).slice(0, 200).map((element) => {
        const text = (element.textContent || "").trim();
        return /login|sign in|connexion|create account|register/i.test(text) ? text : "";
      }),
    ]).slice(0, 20);

    const successHints = uniq(
      (document.body?.innerText || "")
        .split(/\\n+/)
        .map((line) => line.trim())
        .filter((line) => /thank|merci|application received|submitted/i.test(line))
    ).slice(0, 10);

    const verificationHints = uniq(
      (document.body?.innerText || "")
        .split(/\\n+/)
        .map((line) => line.trim())
        .filter((line) => /verify your email|verification code|confirm your email|check your email/i.test(line))
    ).slice(0, 10);

    const errorHints = uniq(
      (document.body?.innerText || "")
        .split(/\\n+/)
        .map((line) => line.trim())
        .filter((line) => /captcha|robot|invalid|try again|error/i.test(line))
    ).slice(0, 10);

    const resumeUploadDetected = Array.from(document.querySelectorAll("input[type=file]")).some((element) => visible(element));

    return {
      host: window.location.host.toLowerCase(),
      flowKey,
      currentUrl: window.location.href,
      headings,
      buttonTexts: uniq(buttonTexts),
      fieldLabels: uniq(fieldLabels),
      requiredQuestions,
      authSignals,
      successHints,
      verificationHints,
      errorHints,
      resumeUploadDetected,
    };
  }, { flowKey: payload.plan.flowKey });
}

await page.goto(payload.url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
await waitForSettled(1800);
await clickByHints(payload.plan.buttonHints.apply);
await waitForSettled(1000);
if (payload.plan.authMode === "guest_preferred") {
  await clickByHints(payload.plan.buttonHints.manual);
  await waitForSettled(800);
  await clickByHints(payload.plan.buttonHints.guest);
  await waitForSettled(1000);
}

const observation = await collectObservation();
console.log(JSON.stringify(observation));
`.trim();
}

function buildApplyPlanScript(input: BrowserRunInput & { plan: ApplyExecutionPlan }) {
  const payload = JSON.stringify(input);

  return `
const payload = ${payload};
const page = await browser.newPage();

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^$()|[\\]\\\\{}]/g, "\\\\$&");
}

async function waitForSettled(ms = 1000) {
  await page.waitForTimeout(ms);
}

async function firstVisible(locator) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  return null;
}

async function clickByHints(hints) {
  for (const hint of hints || []) {
    const regex = new RegExp(escapeRegex(hint), "i");
    const candidates = [
      page.getByRole("button", { name: regex }),
      page.getByRole("link", { name: regex }),
      page.getByText(regex),
    ];

    for (const locator of candidates) {
      const target = await firstVisible(locator);
      if (!target) continue;
      await target.click().catch(() => {});
      return true;
    }
  }
  return false;
}

async function resolveField(hints) {
  for (const hint of hints || []) {
    const regex = new RegExp(escapeRegex(hint), "i");
    const candidates = [
      page.getByLabel(regex),
      page.getByPlaceholder(regex),
      page.locator("input, textarea, select").filter({ has: page.locator("label", { hasText: regex }) }),
      page.locator('input[name*="' + hint.replace(/"/g, '\\"') + '"], textarea[name*="' + hint.replace(/"/g, '\\"') + '"], select[name*="' + hint.replace(/"/g, '\\"') + '"]'),
    ];

    for (const locator of candidates) {
      const target = await firstVisible(locator);
      if (target) return target;
    }
  }
  return null;
}

async function fillByHints(hints, value) {
  if (value === undefined || value === null) return false;
  const target = await resolveField(hints);
  if (!target) return false;

  const tag = await target.evaluate((element) => element.tagName.toLowerCase()).catch(() => "");
  const type = await target.getAttribute("type").catch(() => "");

  if (tag === "select") {
    await target.selectOption({ label: String(value) }).catch(() => {});
    await target.selectOption({ value: String(value) }).catch(() => {});
    return true;
  }

  if (type === "checkbox") {
    const shouldCheck = /^(1|true|yes|oui)$/i.test(String(value));
    if (shouldCheck) {
      await target.check().catch(() => {});
    } else {
      await target.uncheck().catch(() => {});
    }
    return true;
  }

  await target.fill(String(value)).catch(async () => {
    await target.click().catch(() => {});
    await page.keyboard.press("Meta+A").catch(() => {});
    await page.keyboard.press("Control+A").catch(() => {});
    await page.keyboard.type(String(value)).catch(() => {});
  });
  return true;
}

async function uploadCv() {
  const locator = page.locator("input[type=file]").first();
  const count = await locator.count().catch(() => 0);
  if (count === 0) return false;
  await locator.setInputFiles(payload.profile.cvPath).catch(() => {});
  await waitForSettled(1000);
  return true;
}

function resolveAnswerValue(answer) {
  return answer?.answer || "";
}

async function fillCoreFields() {
  const fields = payload.plan.fieldHints;
  await fillByHints(fields.firstName, payload.profile.firstName);
  await fillByHints(fields.lastName, payload.profile.lastName);
  await fillByHints(fields.fullName, payload.profile.firstName + " " + payload.profile.lastName);
  await fillByHints(fields.email, payload.profile.email);
  await fillByHints(fields.phone, payload.profile.phone);
  await fillByHints(fields.city, payload.profile.location);
  await fillByHints(fields.linkedinUrl, payload.profile.linkedinUrl || "");
  await fillByHints(fields.website, "");
  await fillByHints(fields.salary, "Open to discuss based on the role and market standards.");
  await fillByHints(fields.availability, "Available as soon as required.");
  await fillByHints(fields.coverLetter, payload.coverLetter);
}

async function fillAuthFields() {
  if (!payload.profile.accountPassword) return false;
  const fields = payload.plan.fieldHints;
  const emailFilled = await fillByHints(fields.email, payload.profile.email);
  const passwordFilled = await fillByHints(fields.password, payload.profile.accountPassword);
  const confirmFilled = await fillByHints(fields.confirmPassword, payload.profile.accountPassword);
  return emailFilled || passwordFilled || confirmFilled;
}

async function visiblePasswordCount() {
  const passwords = page.locator('input[type="password"]');
  const count = await passwords.count().catch(() => 0);
  let visible = 0;
  for (let index = 0; index < count; index += 1) {
    if (await passwords.nth(index).isVisible().catch(() => false)) {
      visible += 1;
    }
  }
  return visible;
}

async function inferVisibleAuthBranch() {
  if (payload.plan.authBranch && payload.plan.authBranch !== "unknown") {
    return payload.plan.authBranch;
  }

  const text = (await extractBodyText()).toLowerCase();
  const passwordCount = await visiblePasswordCount();

  if (/continue as guest|apply as guest|guest|invite/.test(text) && payload.plan.authMode === "guest_preferred") {
    return "guest";
  }
  if (/sign in|log in|connexion/.test(text) && passwordCount <= 1) {
    return "existing_account_sign_in";
  }
  if (/create account|register|sign up|create profile/.test(text) || passwordCount >= 2) {
    return "create_account";
  }
  return "unknown";
}

async function submitAuthBranch(branch) {
  if (branch === "existing_account_sign_in") {
    return (
      await clickButtonByHints(payload.plan.buttonHints.login)
      || await clickButtonByHints(payload.plan.buttonHints.next)
    );
  }

  if (branch === "create_account") {
    return (
      await clickButtonByHints(payload.plan.buttonHints.createAccount)
      || await clickButtonByHints(payload.plan.buttonHints.next)
    );
  }

  return false;
}

async function runAuthBranch(branch) {
  if (!payload.profile.accountPassword || branch === "guest" || branch === "unknown") {
    return false;
  }

  const fields = payload.plan.fieldHints;

  if (branch === "existing_account_sign_in") {
    const passwordCount = await visiblePasswordCount();
    if (passwordCount !== 1) {
      await clickByHints(payload.plan.buttonHints.login);
      await waitForSettled(700);
    }
    await fillByHints(fields.email, payload.profile.email);
    await fillByHints(fields.password, payload.profile.accountPassword);
    await submitAuthBranch(branch);
    await waitForSettled(1200);
    return true;
  }

  const passwordCount = await visiblePasswordCount();
  if (passwordCount < 2) {
    await clickByHints(payload.plan.buttonHints.createAccount);
    await waitForSettled(700);
  }
  await fillByHints(fields.email, payload.profile.email);
  await fillByHints(fields.password, payload.profile.accountPassword);
  await fillByHints(fields.confirmPassword, payload.profile.accountPassword);
  await submitAuthBranch(branch);
  await waitForSettled(1200);

  const fallbackBranch = await inferVisibleAuthBranch();
  if (fallbackBranch === "existing_account_sign_in") {
    await clickByHints(payload.plan.buttonHints.login);
    await waitForSettled(700);
    await fillByHints(fields.email, payload.profile.email);
    await fillByHints(fields.password, payload.profile.accountPassword);
    await submitAuthBranch(fallbackBranch);
    await waitForSettled(1200);
  }

  return true;
}

async function maybeFillVerificationCode() {
  if (!payload.verificationCode) return false;
  return fillByHints(["verification code", "security code", "code", "otp", "confirmation code"], payload.verificationCode);
}

async function fillExtraAnswers() {
  for (const answer of payload.extraAnswers || []) {
    await fillByHints([answer.label, answer.questionKey], resolveAnswerValue(answer));
  }
}

async function extractBodyText() {
  return page.evaluate(() => (document.body?.innerText || "").replace(/\\s+/g, " ").trim());
}

async function collectPendingQuestions() {
  return page.evaluate(() => {
    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    function fieldLabel(element) {
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

    function normalize(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\\w\\s]/g, " ")
        .replace(/\\s+/g, " ")
        .trim();
    }

    return Array.from(document.querySelectorAll("input, textarea, select"))
      .filter((element) => visible(element) && !element.disabled)
      .map((element) => {
        const type = (element.getAttribute("type") || "").toLowerCase();
        if (type === "hidden" || type === "file" || type === "submit" || type === "button") return null;
        const required =
          element.hasAttribute("required")
          || element.getAttribute("aria-required") === "true"
          || element.closest("[aria-required=true]") !== null;
        if (!required) return null;
        const label = fieldLabel(element);
        if (!label) return null;
        const bodyText = (document.body?.innerText || "").toLowerCase();
        const authScreen =
          /sign in|log in|connexion|create account|register|sign up/.test(bodyText)
          || Array.from(document.querySelectorAll('input[type="password"]')).some((candidate) => visible(candidate));
        if (
          authScreen
          && /email|password|verify new password|confirm password/.test(label.toLowerCase())
        ) {
          return null;
        }

        let empty = false;
        let options = [];
        if (element instanceof HTMLSelectElement) {
          empty = !element.value;
          options = Array.from(element.options).map((option) => option.textContent?.trim() || option.value).filter(Boolean);
        } else {
          empty = !(element).value;
        }
        if (!empty) return null;

        return {
          key: normalize(label),
          label,
          type: element instanceof HTMLTextAreaElement ? "textarea" : element instanceof HTMLSelectElement ? "select" : "text",
          required: true,
          options,
        };
      })
      .filter(Boolean)
      .slice(0, 12);
  });
}

async function successDetected() {
  const text = await extractBodyText();
  return payload.plan.successHints.some((hint) => text.toLowerCase().includes(hint.toLowerCase()));
}

async function verificationRequested() {
  const text = await extractBodyText();
  return payload.plan.verificationHints.some((hint) => text.toLowerCase().includes(hint.toLowerCase()));
}

async function capture(status, message, questions) {
  const text = await extractBodyText();
  try {
    await page.screenshot({ path: payload.screenshotPath, fullPage: true });
  } catch {}

  console.log(JSON.stringify({
    status,
    message,
    currentUrl: page.url(),
    pageTextSnippet: text.slice(0, 1500),
    questions: questions || [],
    screenshotPath: payload.screenshotPath,
    successSignal: payload.plan.successHints.find((hint) => text.toLowerCase().includes(hint.toLowerCase())) || null,
  }));
}

await page.goto(payload.url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
await waitForSettled(1600);
await clickByHints(payload.plan.buttonHints.apply);
await waitForSettled(800);
let guestEntered = false;
if (payload.plan.authMode === "guest_preferred") {
  await clickByHints(payload.plan.buttonHints.manual);
  await waitForSettled(600);
  guestEntered = await clickByHints(payload.plan.buttonHints.guest);
  await waitForSettled(800);
}

const authBranch = await inferVisibleAuthBranch();
if ((!guestEntered || authBranch !== "guest") && authBranch !== "unknown") {
  await runAuthBranch(authBranch);
} else if (payload.plan.authMode !== "guest_preferred") {
  const authTouched = await fillAuthFields();
  if (authTouched) {
    await clickByHints(payload.plan.buttonHints.createAccount);
    await clickByHints(payload.plan.buttonHints.login);
    await clickByHints(payload.plan.buttonHints.next);
    await waitForSettled(1000);
  }
}
await maybeFillVerificationCode();
await fillCoreFields();
if (payload.plan.resumeUploadRequired) {
  await uploadCv();
}
await fillExtraAnswers();

for (let step = 0; step < 6; step += 1) {
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

  const advanced =
    await clickByHints(payload.plan.buttonHints.review)
    || await clickByHints(payload.plan.buttonHints.next)
    || await clickByHints(payload.plan.buttonHints.submit);

  if (!advanced) break;

  await waitForSettled(1200);
  await maybeFillVerificationCode();
  await fillCoreFields();
  if (payload.plan.resumeUploadRequired) {
    await uploadCv();
  }
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

await capture("manual_review", "Plan-based browser flow ended without a clear success signal", []);
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

    child.on("error", (error) => {
      stderr += error instanceof Error ? error.message : String(error);
      resolve({ code: null, stdout, stderr });
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });

    child.stdin.write(script);
    child.stdin.end();
  });
}

function parseJsonLine<T>(stdout: string) {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reverse();

  for (const line of lines) {
    if (!line.startsWith("{") || !line.endsWith("}")) continue;
    try {
      return JSON.parse(line) as T;
    } catch {
      continue;
    }
  }

  return null;
}
