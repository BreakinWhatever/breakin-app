import { existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import type { CandidateProfile, ProfileKey } from "./types";

interface CvDataProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  cvFile?: string;
  linkedinUrl?: string;
}

interface CvData {
  fr?: CvDataProfile;
  en?: CvDataProfile;
  education?: Array<{ school?: string; degree?: string; dates?: string; location?: string }>;
  experience?: Array<{ company?: string; role?: string; team?: string; dates?: string; location?: string }>;
  skills?: string[];
  languages?: string[];
}

const ENGLISH_HINTS = /\b(the|and|for|with|our|your|role|team|you|will|have|experience|internship)\b/gi;
const FRENCH_HINTS = /\b(le|la|les|et|pour|avec|notre|votre|poste|vous|sera|experience|stage)\b/gi;

export async function resolveCandidateProfile(
  languageHint: string,
  workspaceDir: string
): Promise<CandidateProfile> {
  const settings = await loadSettings();
  const cvData = parseCvData(settings.cvData);
  const key = normalizeLanguage(languageHint);
  const profile = key === "en" ? cvData.en : cvData.fr;
  const fallback = cvData[key] ?? cvData.fr ?? cvData.en ?? {};

  const firstName = readNonEmpty(
    profile?.firstName,
    fallback.firstName,
    process.env.APPLY_FIRST_NAME,
    "Ousmane"
  );
  const lastName = readNonEmpty(
    profile?.lastName,
    fallback.lastName,
    process.env.APPLY_LAST_NAME,
    "Thienta"
  );
  const email = key === "en"
    ? readNonEmpty(
        process.env.APPLY_EMAIL_EN,
        profile?.email,
        "applications@ousmanethienta.com"
      )
    : readNonEmpty(
        process.env.APPLY_EMAIL_FR,
        profile?.email,
        "candidatures@ousmanethienta.com"
      );
  const phone = readNonEmpty(
    process.env.APPLY_PHONE,
    profile?.phone,
    fallback.phone,
    "+33646230380"
  );
  const location = readNonEmpty(
    key === "en" ? process.env.APPLY_LOCATION_EN : process.env.APPLY_LOCATION_FR,
    profile?.location,
    fallback.location,
    key === "en" ? "London / Paris" : "Paris"
  );
  const cvPath = resolveCvPath(key, workspaceDir, settings, profile, fallback);
  const accountPassword = readNonEmpty(
    process.env.APPLY_ACCOUNT_PASSWORD,
    process.env.BREAKIN_APPLY_ACCOUNT_PASSWORD,
    ""
  );
  const education = (cvData.education ?? []).map(formatEducation).filter(Boolean);
  const experience = (cvData.experience ?? []).map(formatExperience).filter(Boolean);
  const skills = (cvData.skills ?? []).filter(Boolean);
  const languages = (cvData.languages ?? []).filter(Boolean);
  const summary = [
    `${firstName} ${lastName}, finance candidate focused on Private Credit, LevFin, M&A and Transaction Services.`,
    experience.length > 0 ? `Experience: ${experience.slice(0, 3).join(" | ")}` : "",
    education.length > 0 ? `Education: ${education.slice(0, 2).join(" | ")}` : "",
    skills.length > 0 ? `Skills: ${skills.slice(0, 8).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    key,
    language: key,
    firstName,
    lastName,
    email,
    phone,
    location,
    cvPath,
    cvFileName: path.basename(cvPath),
    accountPassword,
    summary,
    education,
    experience,
    skills,
    languages,
    linkedinUrl: profile?.linkedinUrl ?? fallback.linkedinUrl ?? null,
  };
}

export function detectOfferLanguage(title: string, description: string, country?: string | null) {
  const text = `${title}\n${description}`.toLowerCase();
  const english = (text.match(ENGLISH_HINTS) ?? []).length;
  const french = (text.match(FRENCH_HINTS) ?? []).length;
  if (english > french) return "en";
  if (french > english) return "fr";
  if (country && /france|belgium|switzerland/i.test(country)) return "fr";
  return "en";
}

function normalizeLanguage(languageHint: string): ProfileKey {
  return /^en\b/i.test(languageHint) ? "en" : "fr";
}

async function loadSettings() {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
}

function parseCvData(raw: string | undefined): CvData {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CvData;
  } catch {
    return {};
  }
}

function resolveCvPath(
  key: ProfileKey,
  workspaceDir: string,
  settings: Record<string, string>,
  profile: CvDataProfile | undefined,
  fallback: CvDataProfile
) {
  const candidates = key === "en"
    ? [
        process.env.APPLY_CV_EN_PATH,
        settings.applyCvPathEn,
        profile?.cvFile,
        fallback.cvFile,
        settings.cvPath,
      ]
    : [
        process.env.APPLY_CV_FR_PATH,
        settings.applyCvPathFr,
        profile?.cvFile,
        fallback.cvFile,
        settings.cvPath,
      ];

  for (const candidate of candidates) {
    const resolved = resolveCvCandidate(candidate, workspaceDir);
    if (resolved) return resolved;
  }

  const fallbackFile = path.join(workspaceDir, "public", "cv", "Ousmane_Thienta_CV.pdf");
  return fallbackFile;
}

function resolveCvCandidate(candidate: string | undefined, workspaceDir: string) {
  if (!candidate) return null;
  if (candidate.startsWith("/cv/")) {
    const resolved = path.join(workspaceDir, "public", candidate.replace(/^\//, ""));
    return existsSync(resolved) ? resolved : null;
  }
  if (path.isAbsolute(candidate)) {
    return existsSync(candidate) ? candidate : null;
  }

  const publicPath = path.join(workspaceDir, "public", "cv", candidate);
  if (existsSync(publicPath)) return publicPath;

  const relativePath = path.join(workspaceDir, candidate);
  return existsSync(relativePath) ? relativePath : null;
}

function formatEducation(entry: NonNullable<CvData["education"]>[number]) {
  return [entry.school, entry.degree, entry.dates, entry.location]
    .filter(Boolean)
    .join(" - ");
}

function formatExperience(entry: NonNullable<CvData["experience"]>[number]) {
  return [entry.company, entry.role, entry.team, entry.dates, entry.location]
    .filter(Boolean)
    .join(" - ");
}

function readNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}
