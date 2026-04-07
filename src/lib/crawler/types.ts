import type { AtsType } from "@/generated/prisma/enums";

export interface SourceCompany {
  id: string;
  name: string;
  sector: string;
  city: string;
  country: string;
  careerUrl: string | null;
  atsType: AtsType | null;
  atsConfig: unknown;
  active: boolean;
}

export interface CrawlRequest {
  keywords: string[];
  cities: string[];
  days: number;
  max: number;
  includeWebSearch: boolean;
  useBrowserFallback: boolean;
}

export interface ExtractedJob {
  url: string;
  title: string;
  description: string;
  city?: string;
  country?: string;
  postedAt?: string | null;
  contractType?: string | null;
  sourceDetails?: Record<string, unknown>;
}

export interface CandidatePage {
  url: string;
  discoverySource: "registry" | "web";
  query?: string;
}

export interface HarvestContext {
  company: SourceCompany;
  pageUrl: string;
  request: CrawlRequest;
  discoverySource: CandidatePage["discoverySource"];
}

export interface WebSearchResult {
  url: string;
  title: string;
  snippet: string;
}
