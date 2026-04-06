import { describe, it, expect } from "vitest";

// Test the WHERE clause builder logic (pure function, no DB needed)
function buildCompaniesWhere(params: {
  city?: string | null;
  sector?: string | null;
  search?: string | null;
  active?: string | null;
}): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (params.city) where.city = params.city;
  if (params.sector) where.sector = params.sector;
  if (params.search) where.name = { contains: params.search };
  if (params.active === "true") where.active = true;
  if (params.active === "false") where.active = false;
  return where;
}

describe("buildCompaniesWhere", () => {
  it("returns empty where when no params", () => {
    expect(buildCompaniesWhere({})).toEqual({});
  });

  it("adds active=true filter", () => {
    const where = buildCompaniesWhere({ active: "true" });
    expect(where.active).toBe(true);
  });

  it("adds active=false filter", () => {
    const where = buildCompaniesWhere({ active: "false" });
    expect(where.active).toBe(false);
  });

  it("ignores active param when not 'true' or 'false'", () => {
    const where = buildCompaniesWhere({ active: null });
    expect(where.active).toBeUndefined();
  });

  it("combines city + active filters", () => {
    const where = buildCompaniesWhere({ city: "Paris", active: "true" });
    expect(where).toEqual({ city: "Paris", active: true });
  });

  it("adds name search filter", () => {
    const where = buildCompaniesWhere({ search: "Ardian" });
    expect(where.name).toEqual({ contains: "Ardian" });
  });
});
