import { describe, it, expect } from "vitest";
import {
  buildSearchParams,
  mapApolloPersonToContact,
  mapApolloOrgToCompany,
} from "@/lib/apollo";
import type { ApolloPerson, ApolloOrg } from "@/lib/apollo";

describe("buildSearchParams", () => {
  it("returns default page and per_page when no input given", () => {
    const result = buildSearchParams({});
    expect(result).toEqual({
      page: 1,
      per_page: 25,
    });
  });

  it("maps title to person_titles array", () => {
    const result = buildSearchParams({ title: "Analyst" });
    expect(result.person_titles).toEqual(["Analyst"]);
  });

  it("maps city to person_locations array", () => {
    const result = buildSearchParams({ city: "Paris" });
    expect(result.person_locations).toEqual(["Paris"]);
  });

  it("maps sector to organization_industry_tag_ids array", () => {
    const result = buildSearchParams({ sector: "finance" });
    expect(result.organization_industry_tag_ids).toEqual(["finance"]);
  });

  it("uses custom page and perPage", () => {
    const result = buildSearchParams({ page: 3, perPage: 10 });
    expect(result.page).toBe(3);
    expect(result.per_page).toBe(10);
  });

  it("combines all params together", () => {
    const result = buildSearchParams({
      title: "VP Finance",
      city: "London",
      sector: "banking",
      page: 2,
      perPage: 50,
    });
    expect(result).toEqual({
      page: 2,
      per_page: 50,
      person_titles: ["VP Finance"],
      person_locations: ["London"],
      organization_industry_tag_ids: ["banking"],
    });
  });
});

describe("mapApolloPersonToContact", () => {
  const basePerson: ApolloPerson = {
    id: "apollo-123",
    first_name: "Jean",
    last_name: "Dupont",
    title: "Directeur Financier",
    email: "jean.dupont@example.com",
    linkedin_url: "https://linkedin.com/in/jeandupont",
    organization_id: "org-456",
    organization: null,
  };

  it("maps all fields correctly", () => {
    const contact = mapApolloPersonToContact(basePerson);
    expect(contact).toEqual({
      firstName: "Jean",
      lastName: "Dupont",
      title: "Directeur Financier",
      email: "jean.dupont@example.com",
      linkedinUrl: "https://linkedin.com/in/jeandupont",
      apolloId: "apollo-123",
      source: "apollo",
    });
  });

  it("handles null email", () => {
    const person = { ...basePerson, email: null };
    const contact = mapApolloPersonToContact(person);
    expect(contact.email).toBe("");
  });

  it("handles null linkedin_url", () => {
    const person = { ...basePerson, linkedin_url: null };
    const contact = mapApolloPersonToContact(person);
    expect(contact.linkedinUrl).toBeNull();
  });

  it("always sets source to 'apollo'", () => {
    const contact = mapApolloPersonToContact(basePerson);
    expect(contact.source).toBe("apollo");
  });
});

describe("mapApolloOrgToCompany", () => {
  const baseOrg: ApolloOrg = {
    id: "org-789",
    name: "BNP Paribas",
    industry: "Banking",
    estimated_num_employees: 5000,
    city: "Paris",
    country: "France",
    website_url: "https://bnpparibas.com",
  };

  it("maps all fields correctly", () => {
    const company = mapApolloOrgToCompany(baseOrg);
    expect(company).toEqual({
      name: "BNP Paribas",
      sector: "Banking",
      size: "5000 employees",
      city: "Paris",
      country: "France",
      website: "https://bnpparibas.com",
      apolloId: "org-789",
    });
  });

  it("handles null industry", () => {
    const org = { ...baseOrg, industry: null };
    const company = mapApolloOrgToCompany(org);
    expect(company.sector).toBe("");
  });

  it("handles null estimated_num_employees", () => {
    const org = { ...baseOrg, estimated_num_employees: null };
    const company = mapApolloOrgToCompany(org);
    expect(company.size).toBe("");
  });

  it("handles null city", () => {
    const org = { ...baseOrg, city: null };
    const company = mapApolloOrgToCompany(org);
    expect(company.city).toBe("");
  });

  it("handles null country", () => {
    const org = { ...baseOrg, country: null };
    const company = mapApolloOrgToCompany(org);
    expect(company.country).toBe("");
  });

  it("handles null website_url", () => {
    const org = { ...baseOrg, website_url: null };
    const company = mapApolloOrgToCompany(org);
    expect(company.website).toBeNull();
  });
});
