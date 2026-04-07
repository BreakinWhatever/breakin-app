import type { CandidatePage, CrawlRequest } from "@/lib/crawler/types";
import type { LlmProvider } from "@/lib/scoring/llm";

export type SearchPhase =
  | "queued"
  | "starting"
  | "loading_companies"
  | "crawling"
  | "scoring"
  | "importing"
  | "completed"
  | "failed";

export interface SearchOffersInput {
  keywords: string[];
  cities: string[];
  days: number;
  max: number;
  companyNames: string[];
  includeWebSearch: boolean;
  useBrowserFallback: boolean;
  importToDb: boolean;
  score: boolean;
  llmProvider: LlmProvider;
  llmMaxOffers: number;
  outputDir: string;
  storageDir: string;
  source: string;
  limitCompanies?: number;
}

export interface SearchProgress {
  phase: SearchPhase;
  updatedAt: string;
  message?: string;
  scrapeRunId?: string | null;
  companiesConsidered: number;
  companiesScraped: number;
  pagesVisited: number;
  pagesWithErrors: number;
  offersFound: number;
  offersScored: number;
  offersImported: number;
  llmAssistedOffers: number;
  currentCompany?: string;
  currentPageUrl?: string;
}

export interface PersistableOffer {
  companyId: string;
  company: string;
  sector: string;
  discoverySource: CandidatePage["discoverySource"];
  pageUrl: string;
  url: string;
  title: string;
  description: string;
  city: string;
  country: string;
  contractType: string;
  source: string;
  postedAt: string | null;
  matchScore: number | null;
  matchAnalysis: string | null;
  baseScore: number | null;
  llmUsed: boolean;
  sourceDetails?: Record<string, unknown>;
}

export interface PageAttempt {
  companyId: string;
  company: string;
  pageUrl: string;
  discoverySource: CandidatePage["discoverySource"];
  offers: number;
  status: "ok" | "error";
  error?: string;
}

export interface SearchArtifacts {
  outputDir: string;
  storageDir: string;
  summaryFile: string;
  offersFile: string;
  csvFile: string;
}

export interface SearchSummary {
  source: string;
  scrapeRunId: string | null;
  request: CrawlRequest;
  companiesConsidered: number;
  companiesScraped: number;
  pagesVisited: number;
  pagesWithErrors: number;
  offersFound: number;
  offersImported: number;
  offersUpdated: number;
  offersSkipped: number;
  offersScored: number;
  llmAssistedOffers: number;
  startedAt: string;
  endedAt: string;
  topOffers: Array<Pick<
    PersistableOffer,
    "title" | "company" | "city" | "country" | "url" | "matchScore"
  >>;
  errors: string[];
  artifacts: SearchArtifacts;
}

export interface SearchRunHooks {
  onProgress?: (progress: SearchProgress) => Promise<void> | void;
}
