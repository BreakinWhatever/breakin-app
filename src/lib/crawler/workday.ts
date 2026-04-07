import { normalizeUrl } from "./filters";

export function buildWorkdayJobUrl(input: {
  origin: string;
  tenant: string;
  site: string;
  externalPath: string;
}) {
  const { origin, tenant, site, externalPath } = input;
  const trimmedOrigin = origin.replace(/\/+$/, "");
  const rawPath = externalPath.trim();

  if (!rawPath) return "";

  if (/^https?:\/\//i.test(rawPath)) {
    return normalizeWorkdayJobUrl(rawPath);
  }

  const cleanedPath = rawPath.replace(/^\/+/, "");
  if (/^wday\/cxs\//i.test(cleanedPath)) {
    return normalizeWorkdayJobUrl(`${trimmedOrigin}/${cleanedPath}`);
  }

  const withoutJobPrefix = cleanedPath.replace(/^job\/+/i, "");
  return normalizeWorkdayJobUrl(
    `${trimmedOrigin}/wday/cxs/${tenant}/${site}/job/${withoutJobPrefix}`
  );
}

export function normalizeWorkdayJobUrl(url: string) {
  const normalized = normalizeUrl(url);

  try {
    const parsed = new URL(normalized);
    if (!/myworkdayjobs\.com$/i.test(parsed.hostname)) {
      return normalized;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const cxsIndex = segments.findIndex((segment) => segment === "cxs");
    const siteIndex = cxsIndex + 2;

    if (cxsIndex < 0 || !segments[siteIndex]) {
      return normalized;
    }

    const prefix = segments.slice(0, siteIndex + 1);
    const suffix = segments.slice(siteIndex + 1);

    while (suffix[0]?.toLowerCase() === "job") {
      suffix.shift();
    }

    if (suffix.length === 0) {
      return normalized;
    }

    parsed.pathname = `/${[...prefix, "job", ...suffix].join("/")}`;
    return normalizeUrl(parsed.toString());
  } catch {
    return normalized;
  }
}
