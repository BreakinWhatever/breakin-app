"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  company: string;
  website?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function domainFromCompany(company: string): string {
  // Common finance company domain mappings
  const known: Record<string, string> = {
    "societe generale": "societegenerale.com",
    "bnp paribas": "bnpparibas.com",
    "credit agricole": "credit-agricole.com",
    "credit agricole cib": "ca-cib.com",
    "ca cib": "ca-cib.com",
    "ca-cib": "ca-cib.com",
    "natixis": "natixis.com",
    "bpce": "groupebpce.com",
    "lazard": "lazard.com",
    "rothschild": "rothschildandco.com",
    "morgan stanley": "morganstanley.com",
    "goldman sachs": "goldmansachs.com",
    "jp morgan": "jpmorgan.com",
    "jpmorgan": "jpmorgan.com",
    "jpmorganchase": "jpmorgan.com",
    "blackrock": "blackrock.com",
    "ardian": "ardian.com",
    "tikehau": "tikehaucapital.com",
    "tikehau capital": "tikehaucapital.com",
    "eurazeo": "eurazeo.com",
    "antin": "antin-ip.com",
    "ares": "aresmgmt.com",
    "ares management": "aresmgmt.com",
    "apollo": "apollo.com",
    "kkr": "kkr.com",
    "carlyle": "carlyle.com",
    "blackstone": "blackstone.com",
    "hsbc": "hsbc.com",
    "barclays": "barclays.com",
    "deutsche bank": "db.com",
    "ubs": "ubs.com",
    "credit suisse": "credit-suisse.com",
    "citi": "citi.com",
    "citigroup": "citi.com",
    "mufg": "mufg.jp",
    "ing": "ing.com",
    "houlihan lokey": "hl.com",
    "jefferies": "jefferies.com",
    "macquarie": "macquarie.com",
    "lgt capital partners": "lgtcp.com",
    "lgt capital": "lgtcp.com",
    "s&p global": "spglobal.com",
    "bloomberg": "bloomberg.com",
    "freshfields": "freshfields.com",
    "mercor": "mercor.com",
  };

  const normalized = company.toLowerCase().trim();
  if (known[normalized]) return known[normalized];

  // Try to derive domain: strip common suffixes, use .com
  const cleaned = normalized
    .replace(/\b(s\.a\.|sa|sas|sarl|ltd|limited|inc|gmbh|plc|llp|group|france|uk)\b/gi, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "");

  if (cleaned.length >= 3) return `${cleaned}.com`;
  return "";
}

const sizeConfig = {
  sm: { px: 20, cls: "size-5" },
  md: { px: 28, cls: "size-7" },
  lg: { px: 40, cls: "size-10" },
};

export function CompanyLogo({
  company,
  website,
  size = "md",
  className,
}: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);

  const domain = website
    ? website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    : domainFromCompany(company);

  const { px, cls } = sizeConfig[size];

  if (!domain || failed) {
    return (
      <div
        className={cn(
          cls,
          "rounded bg-muted flex items-center justify-center shrink-0",
          className
        )}
      >
        <Building2 className="size-3.5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={`https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=${px * 2}&format=png`}
      alt={company}
      width={px}
      height={px}
      className={cn(cls, "rounded bg-white object-contain shrink-0", className)}
      onError={() => setFailed(true)}
    />
  );
}
