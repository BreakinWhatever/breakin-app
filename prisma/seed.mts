import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Settings
  const defaults: Record<string, string> = {
    maxEmailsPerDay: "30",
    sendOnWeekends: "false",
    followUpSpacing: "[3, 7, 14]",
    maxFollowUps: "3",
    defaultLanguage: "fr",
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Sample companies
  const tikehau = await prisma.company.create({
    data: {
      name: "Tikehau Capital",
      sector: "Private Credit",
      size: "Large cap",
      city: "Paris",
      country: "France",
      website: "https://www.tikehaucapital.com",
    },
  });

  const ares = await prisma.company.create({
    data: {
      name: "Ares Management",
      sector: "Private Credit",
      size: "Large cap",
      city: "London",
      country: "United Kingdom",
      website: "https://www.aresmgmt.com",
    },
  });

  const rothschild = await prisma.company.create({
    data: {
      name: "Rothschild & Co",
      sector: "M&A Advisory",
      size: "Large cap",
      city: "Paris",
      country: "France",
      website: "https://www.rothschildandco.com",
    },
  });

  // Sample contacts
  const contact1 = await prisma.contact.create({
    data: {
      firstName: "Marc",
      lastName: "Dupont",
      companyId: tikehau.id,
      title: "Managing Director - Direct Lending",
      email: "marc.dupont@tikehaucapital.com",
      priority: 1,
      source: "manual",
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      firstName: "Sarah",
      lastName: "Chen",
      companyId: ares.id,
      title: "Vice President - Private Credit",
      email: "sarah.chen@aresmgmt.com",
      priority: 2,
      source: "manual",
    },
  });

  await prisma.contact.create({
    data: {
      firstName: "Pierre",
      lastName: "Martin",
      companyId: rothschild.id,
      title: "Director - Debt Advisory",
      email: "pierre.martin@rothschildandco.com",
      priority: 2,
      source: "manual",
    },
  });

  // Sample templates
  const templateFR = await prisma.template.create({
    data: {
      name: "Initial - Private Credit FR",
      subject: "Candidature spontanee - {role}",
      body: "Bonjour {firstName},\n\nJe me permets de vous contacter car je suis tres interesse par les activites de {companyName} en private credit.\n\nActuellement en fin de stage chez LGT Capital Partners en Direct Lending, je recherche un poste de {role}.\n\nSeriez-vous disponible pour un echange de 15 minutes ?\n\nCordialement,\nOusmane Thienta",
      variables: JSON.stringify(["firstName", "companyName", "role"]),
      language: "fr",
      category: "initial",
    },
  });

  await prisma.template.create({
    data: {
      name: "Follow-up 1 FR",
      subject: "Re: Candidature spontanee - {role}",
      body: "Bonjour {firstName},\n\nJe me permets de relancer mon message precedent. Je serais ravi d'echanger avec vous sur les opportunites chez {companyName}.\n\nBien cordialement,\nOusmane Thienta",
      variables: JSON.stringify(["firstName", "companyName", "role"]),
      language: "fr",
      category: "followup_1",
    },
  });

  await prisma.template.create({
    data: {
      name: "Initial - Private Credit EN",
      subject: "Spontaneous Application - {role}",
      body: "Dear {firstName},\n\nI am reaching out regarding {companyName}'s private credit activities.\n\nI am currently completing an internship at LGT Capital Partners on the Direct Lending deal team and am looking for a {role} position.\n\nWould you have 15 minutes for a brief call?\n\nBest regards,\nOusmane Thienta",
      variables: JSON.stringify(["firstName", "companyName", "role"]),
      language: "en",
      category: "initial",
    },
  });

  // Sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: "Direct Lending Paris Q2 2026",
      targetRole: "Private Credit Analyst",
      targetCity: "Paris",
      templateId: templateFR.id,
      status: "active",
    },
  });

  // Sample outreaches
  await prisma.outreach.create({
    data: {
      contactId: contact1.id,
      campaignId: campaign.id,
      status: "contacted",
      lastContactDate: new Date("2026-03-28"),
      nextActionDate: new Date("2026-04-01"),
      nextActionType: "followup_1",
    },
  });

  await prisma.outreach.create({
    data: {
      contactId: contact2.id,
      campaignId: campaign.id,
      status: "identified",
    },
  });

  console.log("Seed complete.");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
