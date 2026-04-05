import { prisma } from "@/lib/db";
import icalGenerator from "ical-generator";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: "asc" },
    });

    // Split include queries for Neon HTTP compatibility
    const contactIds = [...new Set(events.filter((e) => e.contactId).map((e) => e.contactId!))];
    const companyIds = [...new Set(events.filter((e) => e.companyId).map((e) => e.companyId!))];

    const [contacts, companies] = await Promise.all([
      contactIds.length > 0
        ? prisma.contact.findMany({ where: { id: { in: contactIds } } })
        : Promise.resolve([]),
      companyIds.length > 0
        ? prisma.company.findMany({ where: { id: { in: companyIds } } })
        : Promise.resolve([]),
    ]);

    const contactMap = new Map(contacts.map((c) => [c.id, c]));
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    const calendar = icalGenerator({
      name: "BreakIn — Entretiens & Relances",
      timezone: "Europe/Paris",
    });

    for (const event of events) {
      const contact = event.contactId ? contactMap.get(event.contactId) : null;
      const company = event.companyId ? companyMap.get(event.companyId) : null;

      const descriptionParts: string[] = [];
      if (event.description) descriptionParts.push(event.description);
      if (contact) descriptionParts.push(`Contact: ${contact.firstName} ${contact.lastName}`);
      if (company) descriptionParts.push(`Entreprise: ${company.name}`);
      if (event.notes) descriptionParts.push(`Notes: ${event.notes}`);

      calendar.createEvent({
        id: event.id,
        start: event.startDate,
        end: event.endDate,
        summary: event.title,
        description: descriptionParts.join("\n") || undefined,
        location: event.location || undefined,
      });
    }

    return new Response(calendar.toString(), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="breakin.ics"',
      },
    });
  } catch (error) {
    console.error("GET /api/calendar/feed error:", error);
    return Response.json(
      { error: "Failed to generate calendar feed" },
      { status: 500 }
    );
  }
}
