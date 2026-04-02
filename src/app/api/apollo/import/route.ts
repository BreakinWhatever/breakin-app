import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { mapApolloPersonToContact, mapApolloOrgToCompany } from "@/lib/apollo";
import type { ApolloPerson } from "@/lib/apollo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { people, campaignId } = body as {
      people: ApolloPerson[];
      campaignId?: string;
    };

    if (!people || !Array.isArray(people) || people.length === 0) {
      return Response.json(
        { error: "people array is required and must not be empty" },
        { status: 400 }
      );
    }

    const imported: { contactId: string; email: string; created: boolean }[] = [];
    const skipped: { email: string | null; reason: string }[] = [];

    for (const person of people) {
      const mapped = mapApolloPersonToContact(person);

      // Skip if no email
      if (!mapped.email) {
        skipped.push({ email: null, reason: "no email" });
        continue;
      }

      // Dedup check: by email or apolloId
      const existing = await prisma.contact.findFirst({
        where: {
          OR: [
            { email: mapped.email },
            ...(mapped.apolloId ? [{ apolloId: mapped.apolloId }] : []),
          ],
        },
      });

      if (existing) {
        skipped.push({ email: mapped.email, reason: "already exists" });

        // Still create outreach if campaignId provided and not already linked
        if (campaignId) {
          const existingOutreach = await prisma.outreach.findUnique({
            where: {
              contactId_campaignId: {
                contactId: existing.id,
                campaignId,
              },
            },
          });
          if (!existingOutreach) {
            await prisma.outreach.create({
              data: {
                contactId: existing.id,
                campaignId,
                status: "identified",
                nextActionType: "initial_email",
                nextActionDate: new Date(),
              },
            });
          }
        }

        imported.push({
          contactId: existing.id,
          email: mapped.email,
          created: false,
        });
        continue;
      }

      // Find or create company
      let companyId: string;

      if (person.organization) {
        const orgMapped = mapApolloOrgToCompany(person.organization);

        // Try to find by apolloId first, then by name+city
        let company = orgMapped.apolloId
          ? await prisma.company.findUnique({
              where: { apolloId: orgMapped.apolloId },
            })
          : null;

        if (!company) {
          company = await prisma.company.findFirst({
            where: {
              name: orgMapped.name,
              city: orgMapped.city,
            },
          });
        }

        if (!company) {
          company = await prisma.company.create({
            data: {
              name: orgMapped.name || "Unknown",
              sector: orgMapped.sector || "Unknown",
              size: orgMapped.size,
              city: orgMapped.city || "Unknown",
              country: orgMapped.country || "Unknown",
              website: orgMapped.website,
              apolloId: orgMapped.apolloId,
            },
          });
        }

        companyId = company.id;
      } else {
        // No org info — find or create a placeholder company
        let placeholder = await prisma.company.findFirst({
          where: { name: "Unknown (Apollo Import)" },
        });

        if (!placeholder) {
          placeholder = await prisma.company.create({
            data: {
              name: "Unknown (Apollo Import)",
              sector: "Unknown",
              city: "Unknown",
              country: "Unknown",
            },
          });
        }

        companyId = placeholder.id;
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          firstName: mapped.firstName,
          lastName: mapped.lastName,
          title: mapped.title,
          email: mapped.email,
          linkedinUrl: mapped.linkedinUrl,
          apolloId: mapped.apolloId,
          source: "apollo",
          companyId,
        },
      });

      // Auto-create outreach if campaignId provided
      if (campaignId) {
        await prisma.outreach.create({
          data: {
            contactId: contact.id,
            campaignId,
            status: "identified",
            nextActionType: "initial_email",
            nextActionDate: new Date(),
          },
        });
      }

      imported.push({
        contactId: contact.id,
        email: mapped.email,
        created: true,
      });
    }

    return Response.json({
      imported: imported.length,
      created: imported.filter((i) => i.created).length,
      skipped: skipped.length,
      details: { imported, skipped },
    });
  } catch (error) {
    console.error("POST /api/apollo/import error:", error);
    return Response.json(
      { error: "Failed to import contacts from Apollo" },
      { status: 500 }
    );
  }
}
