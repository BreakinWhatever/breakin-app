import { prisma } from "@/lib/db";

const DEFAULTS: Record<string, string> = {
  maxEmailsPerDay: "30",
  sendOnWeekends: "false",
  followUpSpacing: "[3, 7, 14]",
  maxFollowUps: "3",
  defaultLanguage: "fr",
};

export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? DEFAULTS[key] ?? "";
}

export async function getFollowUpSpacing(): Promise<number[]> {
  const raw = await getSetting("followUpSpacing");
  return JSON.parse(raw);
}

export async function getMaxFollowUps(): Promise<number> {
  return parseInt(await getSetting("maxFollowUps"), 10);
}

export async function getMaxEmailsPerDay(): Promise<number> {
  return parseInt(await getSetting("maxEmailsPerDay"), 10);
}
