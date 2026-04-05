// Apollo API Client for BreakIn
// Docs: https://apolloio.github.io/apollo-api-docs/

import { prisma } from "@/lib/db";

const APOLLO_BASE_URL = "https://api.apollo.io";

async function getApolloApiKey(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: "apolloApiKey" } });
  return setting?.value || process.env.APOLLO_API_KEY || "";
}

// ---------- Types ----------

export interface ApolloSearchInput {
  title?: string;
  city?: string;
  sector?: string;
  page?: number;
  perPage?: number;
}

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string | null;
  linkedin_url: string | null;
  organization_id: string | null;
  organization: ApolloOrg | null;
}

export interface ApolloOrg {
  id: string;
  name: string;
  industry: string | null;
  estimated_num_employees: number | null;
  city: string | null;
  country: string | null;
  website_url: string | null;
}

export interface MappedContact {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  linkedinUrl: string | null;
  apolloId: string;
  source: "apollo";
}

export interface MappedCompany {
  name: string;
  sector: string;
  size: string;
  city: string;
  country: string;
  website: string | null;
  apolloId: string;
}

export interface SendEmailOptions {
  emailAccountId: string;
  to: string;
  subject: string;
  body: string;
}

// ---------- Helpers ----------

export function buildSearchParams(input: ApolloSearchInput): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page: input.page ?? 1,
    per_page: input.perPage ?? 25,
  };

  if (input.title) {
    params.person_titles = [input.title];
  }

  if (input.city) {
    params.person_locations = [input.city];
  }

  if (input.sector) {
    params.organization_industry_tag_ids = [input.sector];
  }

  return params;
}

export function mapApolloPersonToContact(person: ApolloPerson): MappedContact {
  return {
    firstName: person.first_name ?? "",
    lastName: person.last_name ?? "",
    title: person.title ?? "",
    email: person.email ?? "",
    linkedinUrl: person.linkedin_url ?? null,
    apolloId: person.id,
    source: "apollo",
  };
}

export function mapApolloOrgToCompany(org: ApolloOrg): MappedCompany {
  const size = org.estimated_num_employees
    ? `${org.estimated_num_employees} employees`
    : "";

  return {
    name: org.name ?? "",
    sector: org.industry ?? "",
    size,
    city: org.city ?? "",
    country: org.country ?? "",
    website: org.website_url ?? null,
    apolloId: org.id,
  };
}

// ---------- API Calls ----------

export async function searchPeople(input: ApolloSearchInput) {
  const apiKey = await getApolloApiKey();
  const searchParams = buildSearchParams(input);

  const response = await fetch(`${APOLLO_BASE_URL}/v1/mixed_people/api_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(searchParams),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apollo API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  const people: ApolloPerson[] = data.people ?? [];
  const contacts = people.map(mapApolloPersonToContact);

  return {
    contacts,
    people,
    pagination: {
      page: data.pagination?.page ?? 1,
      perPage: data.pagination?.per_page ?? 25,
      totalEntries: data.pagination?.total_entries ?? 0,
      totalPages: data.pagination?.total_pages ?? 0,
    },
  };
}

export async function revealPerson(personId: string) {
  const apiKey = await getApolloApiKey();

  const response = await fetch(`${APOLLO_BASE_URL}/v1/people/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      id: personId,
      reveal_personal_emails: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apollo reveal error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const person = data.person ?? data;

  return {
    firstName: person.first_name ?? "",
    lastName: person.last_name ?? "",
    title: person.title ?? "",
    email: person.email ?? null,
    linkedinUrl: person.linkedin_url ?? null,
    apolloId: person.id,
    source: "apollo" as const,
    apolloOrgId: person.organization?.id ?? null,
    apolloOrgName: person.organization?.name ?? null,
    apolloOrgCity: person.organization?.city ?? null,
    apolloOrgCountry: person.organization?.country ?? null,
  };
}

export async function revealPeople(personIds: string[]) {
  const results = [];
  for (const id of personIds) {
    try {
      const revealed = await revealPerson(id);
      if (revealed.email) {
        results.push(revealed);
      }
    } catch {
      // Skip failed reveals (e.g., out of credits)
    }
  }
  return results;
}

// ---------- Email Sending (via Resend) ----------

import { sendEmailViaResend } from "@/lib/resend";

export async function sendEmail(options: {
  to: string;
  subject: string;
  body: string;
  language?: string;
}) {
  return sendEmailViaResend({
    to: options.to,
    subject: options.subject,
    body: options.body,
    language: options.language ?? "fr",
  });
}
