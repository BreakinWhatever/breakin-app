import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
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
  const result = await runBrowserScript(script);
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

function runBrowserScript(script: string): Promise<CliResult> {
  return runDevBrowser(script);
}

function buildApplyScript(input: BrowserRunInput) {
  const payload = JSON.stringify({
    ...input,
    profile: {
      ...input.profile,
      cvBase64: readFileSync(input.profile.cvPath).toString("base64"),
    },
  });

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

  for (const pattern of patterns) {
    const regex = new RegExp(pattern, "i");
    const candidates = [
      page.getByRole("button", { name: regex }),
      page.getByRole("link", { name: regex }),
      page.getByText(regex),
    ];

    for (const locator of candidates) {
      const target = await firstVisible(locator);
      if (!target) continue;
      try {
        await target.click({ timeout: 2000 });
        return true;
      } catch {}
    }
  }

  return false;
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

    function assignValue(element, value) {
      const prototype =
        element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
      descriptor?.set?.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
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
      assignValue(element, value);
      element.blur();
      return true;
    }

    return false;
  }, { rawPatterns: patterns, rawValue: value });
}

async function uploadCv() {
  try {
    const locator = page.locator('input[type=file], input[data-automation-id="file-upload-input-ref"]').first();
    const count = await locator.count();
    if (count === 0) return false;
    await locator.setInputFiles([{
      name: payload.profile.cvFileName || "resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(payload.profile.cvBase64 || "", "base64"),
    }]);
    await waitForSettled(3000);
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
  await fillWorkdayMyInformation();
}

async function fillExtraAnswers() {
  for (const answer of payload.extraAnswers || []) {
    await fillPatterns([
      answer.label,
      answer.questionKey,
    ], answer.answer);
  }
}

function inferWorkdayCountry() {
  const hint = normalize([payload.profile.location, payload.url].join(" "));
  if (/france|paris/.test(hint)) return "France";
  if (/united kingdom|uk|london/.test(hint)) return "United Kingdom";
  if (/united states|usa|new york/.test(hint)) return "United States of America";
  return null;
}

function normalizeWorkdayPhone() {
  const digits = String(payload.profile.phone || "").replace(/\\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("33") && digits.length >= 11) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits.slice(1);
  return digits;
}

async function fillRoleTextbox(name, value) {
  if (!value) return false;

  try {
    const locator = page.getByRole("textbox", { name }).first();
    if ((await locator.count()) === 0) return false;
    await locator.fill("");
    await locator.fill(value);
    await locator.evaluate((element) => {
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.blur();
    });
    return true;
  } catch {
    return false;
  }
}

async function selectWorkdayTextboxOption(name, value) {
  if (payload.platform !== "workday" || !value) return false;

  try {
    const locator = page.getByRole("textbox", { name }).first();
    if ((await locator.count()) === 0) return false;
    await locator.click({ timeout: 2000 });
    await locator.fill("");
    await locator.fill(value);
    await page.keyboard.press("Enter");
    await waitForSettled(1200);
    return true;
  } catch {
    return false;
  }
}

async function selectWorkdayButtonOption(name, option) {
  if (payload.platform !== "workday" || !option) return false;

  try {
    const button = page.getByRole("button", { name }).first();
    if ((await button.count()) === 0) return false;
    await button.click({ timeout: 2000 });
    await waitForSettled(500);
    const choice = page.getByRole("option", { name: new RegExp("^" + option + "$", "i") }).first();
    if ((await choice.count()) === 0) return false;
    await choice.click({ timeout: 2000 });
    await waitForSettled(1000);
    return true;
  } catch {
    return false;
  }
}

async function fillWorkdayMyInformation() {
  if (payload.platform !== "workday") return false;

  const text = await extractBodyText();
  if (!/my information|how did you hear about us|phone device type/i.test(text)) {
    return false;
  }

  const country = inferWorkdayCountry();
  if (country) {
    await selectWorkdayButtonOption(/^country .*required$/i, country);
  }

  await selectWorkdayTextboxOption(
    /how did you hear about us\\?/i,
    payload.profile.linkedinUrl ? "LinkedIn" : "Company Website",
  );
  await selectWorkdayButtonOption(/phone device type/i, "Mobile");

  if (country === "France") {
    await selectWorkdayTextboxOption(/country phone code/i, "France");
  }

  await fillRoleTextbox(/phone number/i, normalizeWorkdayPhone());
  return true;
}

async function waitForWorkdayStep(maxAttempts = 12) {
  if (payload.platform !== "workday") return;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const text = await extractBodyText();
    if (
      !/\\bloading\\b/i.test(text)
      && /create account|my information|my experience|application questions|voluntary disclosures|review|resume\\/cv|upload a file/i.test(text)
    ) {
      return;
    }
    await waitForSettled(1000);
  }
}

async function maybeCreateOrLogin() {
  if (!payload.profile.accountPassword) return false;
  await waitForWorkdayStep();

  if (payload.platform === "workday") {
    const signInOpened = await openWorkdaySignIn();
    if (signInOpened) {
      const loginFilled =
        (await fillWorkdayLoginFieldsDirectly()) ||
        (await fillVisibleAuthFields());
      if (loginFilled && (await submitWorkdaySignIn())) {
        await waitForWorkdayAuthTransition();
        return true;
      }
    }
  }

  const alreadyOnAuthForm = await page.evaluate(() => {
    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    return Array.from(document.querySelectorAll("input[type=password]")).some((element) => visible(element));
  });

  const clicked = alreadyOnAuthForm
    ? false
    : await clickByPatterns([
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

  const directAuthFilled = await fillWorkdayAuthFieldsDirectly();
  if (directAuthFilled && (await submitWorkdayCreateAccount())) {
    const transition = await waitForWorkdayAuthTransition();
    if (transition === "sign_in") {
      const loginFilled =
        (await fillWorkdayLoginFieldsDirectly()) ||
        (await fillVisibleAuthFields());
      if (loginFilled) {
        await submitWorkdaySignIn();
        await waitForWorkdayAuthTransition();
      }
    } else {
      await waitForWorkdayStep();
    }
    return true;
  }
  const passwordFilled = await fillPatterns(["password", "mot de passe"], payload.profile.accountPassword);
  const confirmFilled = await fillPatterns([
    "confirm password",
    "confirm your password",
    "confirmer le mot de passe",
  ], payload.profile.accountPassword);
  const authFallbackFilled = await fillVisibleAuthFields();

  if (directAuthFilled || passwordFilled || confirmFilled || authFallbackFilled) {
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
    await waitForWorkdayStep();
    return true;
  }

  return clicked;
}

async function openWorkdaySignIn() {
  if (payload.platform !== "workday") return false;

  try {
    const locator = page.getByRole("button", { name: /^sign in$/i }).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      await waitForSettled(1500);
      return true;
    }
  } catch {}

  try {
    const locator = page.getByRole("link", { name: /^sign in$/i }).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      await waitForSettled(1500);
      return true;
    }
  } catch {}

  return false;
}

async function isWorkdaySignInPage() {
  if (payload.platform !== "workday") return false;

  return page.evaluate(() => {
    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    const body = (document.body?.innerText || "").toLowerCase();
    const visiblePasswords = Array.from(document.querySelectorAll('input[type="password"]'))
      .filter((element) => visible(element));

    return /sign in/.test(body) && visiblePasswords.length === 1;
  });
}

async function waitForWorkdayAuthTransition(maxAttempts = 10) {
  if (payload.platform !== "workday") return "unknown";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isWorkdaySignInPage()) {
      return "sign_in";
    }

    const text = await extractBodyText();
    if (/my information|my experience|application questions|voluntary disclosures|review|resume\\/cv|upload a file/i.test(text)) {
      return "next_step";
    }

    await waitForSettled(1000);
  }

  return "unknown";
}

async function fillWorkdayAuthFieldsDirectly() {
  if (payload.platform !== "workday" || !payload.profile.accountPassword) return false;

  async function fillSelector(selector, value, visibleIndex = 0) {
    try {
      const candidates = page.locator(selector);
      const count = await candidates.count();
      let currentVisible = 0;
      for (let index = 0; index < count; index += 1) {
        const locator = candidates.nth(index);
        if (!(await locator.isVisible().catch(() => false))) continue;
        if (currentVisible !== visibleIndex) {
          currentVisible += 1;
          continue;
        }
        await locator.fill("");
        await locator.fill(value);
        await locator.evaluate((element) => {
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.blur();
        });
        return (await locator.inputValue()) === value;
      }
      return false;
    } catch {
      return false;
    }
  }

  async function fillLabel(pattern, value) {
    try {
      const candidates = page.getByLabel(pattern);
      const count = await candidates.count();
      for (let index = 0; index < count; index += 1) {
        const locator = candidates.nth(index);
        if (!(await locator.isVisible().catch(() => false))) continue;
        await locator.fill("");
        await locator.fill(value);
        await locator.evaluate((element) => {
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.blur();
        });
        return (await locator.inputValue()) === value;
      }
      return false;
    } catch {
      return false;
    }
  }

  const emailFilled =
    (await fillSelector(
      'input[data-automation-id="email"], input[autocomplete="email"]:not([name="website"])',
      payload.profile.email,
    )) || (await fillLabel(/email address/i, payload.profile.email));
  const passwordFilled =
    (await fillSelector('input[data-automation-id="password"]', payload.profile.accountPassword)) ||
    (await fillLabel(/^password/i, payload.profile.accountPassword)) ||
    (await fillSelector('input[type="password"]', payload.profile.accountPassword, 0)) ||
    (await fillSelector('input[autocomplete="new-password"]', payload.profile.accountPassword, 0));
  const verifyFilled =
    (await fillSelector('input[data-automation-id="verifyPassword"]', payload.profile.accountPassword)) ||
    (await fillLabel(/verify new password/i, payload.profile.accountPassword)) ||
    (await fillSelector('input[type="password"]', payload.profile.accountPassword, 1)) ||
    (await fillSelector('input[autocomplete="new-password"]', payload.profile.accountPassword, 1));

  return emailFilled && passwordFilled && verifyFilled;
}

async function fillWorkdayLoginFieldsDirectly() {
  if (payload.platform !== "workday" || !payload.profile.accountPassword) return false;

  async function fillSelector(selector, value, visibleIndex = 0) {
    try {
      const candidates = page.locator(selector);
      const count = await candidates.count();
      let currentVisible = 0;
      for (let index = 0; index < count; index += 1) {
        const locator = candidates.nth(index);
        if (!(await locator.isVisible().catch(() => false))) continue;
        if (currentVisible !== visibleIndex) {
          currentVisible += 1;
          continue;
        }
        await locator.fill("");
        await locator.fill(value);
        await locator.evaluate((element) => {
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
          element.blur();
        });
        return (await locator.inputValue()) === value;
      }
      return false;
    } catch {
      return false;
    }
  }

  const emailFilled =
    (await fillSelector(
      'input[data-automation-id="email"], input[autocomplete="email"]:not([name="website"])',
      payload.profile.email,
    )) || (await fillSelector('input[type="text"]', payload.profile.email, 0));
  const passwordFilled =
    (await fillSelector('input[data-automation-id="password"]', payload.profile.accountPassword)) ||
    (await fillSelector('input[type="password"]', payload.profile.accountPassword, 0));

  return emailFilled && passwordFilled;
}

async function submitWorkdayCreateAccount() {
  if (payload.platform !== "workday") return false;

  try {
    const locator = page.getByRole("button", { name: /^create account$/i }).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      return true;
    }
  } catch {}

  try {
    const locator = page.getByRole("button", { name: /^create account$/i }).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000, force: true });
      return true;
    }
  } catch {}

  try {
    const locator = page.locator('[data-automation-id="createAccountSubmitButton"]').first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      return true;
    }
  } catch {}

  return false;
}

async function submitWorkdaySignIn() {
  if (payload.platform !== "workday") return false;

  try {
    const locator = page.getByRole("button", { name: /^sign in$/i }).first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      return true;
    }
  } catch {}

  try {
    const locator = page.locator('[data-automation-id="signInSubmitButton"]').first();
    if ((await locator.count()) > 0) {
      await locator.click({ timeout: 2000 });
      return true;
    }
  } catch {}

  return false;
}

async function fillVisibleAuthFields() {
  if (!payload.profile.accountPassword) return false;

  return page.evaluate(({ email, password }) => {
    function visible(element) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }

    function assignValue(element, value) {
      const prototype =
        element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
      element.focus();
      descriptor?.set?.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.blur();
    }

    const inputs = Array.from(document.querySelectorAll("input"))
      .filter(
        (element) =>
          visible(element) &&
          !element.disabled &&
          element.getAttribute("name") !== "website" &&
          element.getAttribute("data-automation-id") !== "beecatcher",
      );

    let touched = false;

    const emailInput = inputs.find((element) => {
      const type = (element.getAttribute("type") || "").toLowerCase();
      if (type === "email") return true;
      if (type && type !== "text") return false;
      const hint = [
        element.getAttribute("aria-label") || "",
        element.getAttribute("placeholder") || "",
        element.getAttribute("name") || "",
        element.id || "",
        element.labels && element.labels[0] ? element.labels[0].innerText : "",
      ].join(" ").toLowerCase();
      return /email|e-mail/.test(hint);
    }) || inputs.find((element) => {
      const type = (element.getAttribute("type") || "text").toLowerCase();
      return type === "text" || type === "email";
    });

    if (emailInput && !emailInput.value) {
      assignValue(emailInput, email);
      touched = true;
    }

    const passwordInputs = inputs.filter((element) => (element.getAttribute("type") || "").toLowerCase() === "password");
    for (const input of passwordInputs.slice(0, 2)) {
      if (!input.value) {
        assignValue(input, password);
        touched = true;
      }
    }

    return touched;
  }, {
    email: payload.profile.email,
    password: payload.profile.accountPassword,
  });
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
      } else if (element.getAttribute("data-uxi-widget-type") === "selectinput") {
        const multiselectId = element.getAttribute("data-uxi-multiselect-id") || "";
        const listbox = multiselectId
          ? document.querySelector('[role="listbox"][data-uxi-multiselect-id="' + CSS.escape(multiselectId) + '"]')
          : null;
        const selectedOptions = listbox
          ? Array.from(listbox.querySelectorAll('[role="option"]'))
              .map((option) => option.textContent?.trim() || "")
              .filter(Boolean)
          : [];
        empty = !(element).value && selectedOptions.length === 0;
        options = selectedOptions;
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
    const manual = await clickByPatterns([
      "apply manually",
      "manual",
    ]);
    if (!manual) {
      await clickByPatterns([
        "autofill with resume",
        "resume",
        "use my last application",
      ]);
    }
    await waitForSettled(1500);
    await clickByPatterns(["apply as guest", "guest", "continue as guest", "invite"]);
    await waitForSettled(1500);
    await waitForWorkdayStep();
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
  await waitForWorkdayStep();
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
