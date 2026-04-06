/**
 * Detect contract type from job title and description.
 * Title takes priority over description to avoid false positives.
 * Falls back to raw ATS contract_type string (e.g. from Adzuna).
 */
export function detectContractType(
  title: string,
  description: string,
  raw?: string
): string {
  const t = title.toLowerCase();
  const d = description.toLowerCase().slice(0, 2000);

  // Title takes priority
  if (/\bstage\b|\binternship\b|\bintern\b|off[- ]?cycle/.test(t)) return "Stage";
  if (/\balternance\b|\bapprenti/.test(t)) return "Alternance";
  if (/\bvie\b/.test(t)) return "VIE";
  if (/\bcdd\b|\btemp\b|\btemporary\b|\bfreelance\b/.test(t)) return "CDD";

  // Fall back to description
  if (/\bstage\b|\binternship\b|\bintern\b|off[- ]?cycle/.test(d)) return "Stage";
  if (/\balternance\b|\bapprenti|\bapprentissage\b/.test(d)) return "Alternance";
  if (/\bvolontariat international\b|\bvie\b/.test(d)) return "VIE";

  // Adzuna raw contract_type fallback
  if (raw === "contract") return "CDD";
  if (raw === "permanent") return "CDI";

  return "CDI";
}
