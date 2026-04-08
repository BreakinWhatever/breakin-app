"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Send, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import OffersTable, { type OfferRow } from "@/components/offers/offers-table";
import { OfferSidePanel, type OfferPanelData } from "@/components/offers/offer-side-panel";
import { type BulkAction } from "@/components/shared/data-table";
import { SearchJobCard } from "@/components/jobs/search-job-card";
import { ApplyJobsTray } from "@/components/jobs/apply-jobs-tray";
import { deriveOfferStatus } from "@/components/jobs/job-progress";
import { useRecentApplyJobs } from "@/components/jobs/hooks";

export default function OffresPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedApplyJobIds, setTrackedApplyJobIds] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    city: "",
    contractType: "",
    source: "",
    status: "",
    minScore: "50",
  });

  // Side panel
  const [selectedOffer, setSelectedOffer] = useState<OfferPanelData | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { jobs: applyJobs } = useRecentApplyJobs(trackedApplyJobIds);

  // Fetch offers
  const fetchOffers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilters.city) params.set("city", activeFilters.city);
    if (activeFilters.contractType) params.set("contractType", activeFilters.contractType);
    if (activeFilters.source) params.set("source", activeFilters.source);
    if (activeFilters.status) params.set("status", activeFilters.status);
    if (activeFilters.minScore && activeFilters.minScore !== "all") {
      params.set("minScore", activeFilters.minScore);
    }
    const qs = params.toString();

    fetch(`/api/offers${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setOffers(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [search, activeFilters]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Filter config
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "minScore",
        label: "Score",
        options: [
          { label: "Recommandees (50+)", value: "50" },
          { label: "Fortes (70+)", value: "70" },
          { label: "Toutes scorees (0+)", value: "0" },
          { label: "Toutes", value: "all" },
        ],
      },
      {
        key: "city",
        label: "Ville",
        options: [
          { label: "Paris", value: "Paris" },
          { label: "London", value: "London" },
          { label: "Abidjan", value: "Abidjan" },
        ],
      },
      {
        key: "contractType",
        label: "Type de contrat",
        options: [
          { label: "CDI", value: "CDI" },
          { label: "Stage", value: "Stage" },
          { label: "Alternance", value: "Alternance" },
          { label: "CDD", value: "CDD" },
          { label: "VIE", value: "VIE" },
        ],
      },
      {
        key: "source",
        label: "Source",
        options: [
          { label: "Adzuna", value: "adzuna" },
          { label: "Reed", value: "reed" },
          { label: "WTTJ", value: "wttj" },
          { label: "Manuel", value: "manual" },
        ],
      },
      {
        key: "status",
        label: "Statut",
        options: [
          { label: "Nouveau", value: "new" },
          { label: "Shortlist", value: "shortlisted" },
          { label: "En cours", value: "apply_requested" },
          { label: "Postule", value: "applied" },
          { label: "Echec", value: "apply_failed" },
          { label: "Ignore", value: "ignored" },
        ],
      },
    ],
    []
  );

  // Side panel navigation
  const selectedIndex = selectedOffer
    ? offers.findIndex((o) => o.id === selectedOffer.id)
    : -1;

  const handlePrev =
    selectedIndex > 0
      ? () => {
          const prev = offers[selectedIndex - 1];
          setSelectedOffer(prev as OfferPanelData);
        }
      : undefined;

  const handleNext =
    selectedIndex < offers.length - 1
      ? () => {
          const next = offers[selectedIndex + 1];
          setSelectedOffer(next as OfferPanelData);
        }
      : undefined;

  const handleRowClick = (offer: OfferRow) => {
    setSelectedOffer(offer as OfferPanelData);
    setPanelOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveFilters({
      city: "",
      contractType: "",
      source: "",
      status: "",
      minScore: "50",
    });
  };

  // Update offer status locally (instant UI update)
  const updateOfferStatus = (id: string, status: string) => {
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    setSelectedOffer((prev) => prev?.id === id ? { ...prev, status } : prev);
  };

  useEffect(() => {
    if (applyJobs.length === 0) return;

    const latestByOffer = new Map<string, (typeof applyJobs)[number]>();
    for (const job of applyJobs) {
      const current = latestByOffer.get(job.offerId);
      if (!current || new Date(job.updatedAt).getTime() > new Date(current.updatedAt).getTime()) {
        latestByOffer.set(job.offerId, job);
      }
    }

    setOffers((prev) =>
      prev.map((offer) => {
        const job = latestByOffer.get(offer.id);
        if (!job) return offer;
        const status = deriveOfferStatus(offer.status, job);
        return status === offer.status ? offer : { ...offer, status };
      })
    );
    setSelectedOffer((prev) => {
      if (!prev) return prev;
      const job = latestByOffer.get(prev.id);
      if (!job) return prev;
      const status = deriveOfferStatus(prev.status, job);
      return status === prev.status ? prev : { ...prev, status };
    });
  }, [applyJobs]);

  // Bulk apply
  async function handleBulkApply(selected: OfferRow[]) {
    await Promise.all(
      selected.map(async (item) => {
        try {
          const res = await fetch(`/api/offers/${item.id}/apply`, {
            method: "POST",
          });
          if (!res.ok) throw new Error("Failed");
          const payload = await res.json().catch(() => null);

          if (payload?.reason === "preflight_queued" || payload?.reason === "preflight_running") {
            return;
          }
          if (payload?.reason === "manual_only" || payload?.reason === "blocked") {
            updateOfferStatus(item.id, "apply_failed");
            return;
          }

          updateOfferStatus(item.id, "apply_requested");
          if (payload?.jobId) {
            setTrackedApplyJobIds((prev) =>
              prev.includes(payload.jobId) ? prev : [...prev, payload.jobId]
            );
          }
        } catch {
          updateOfferStatus(item.id, "apply_failed");
        }
      })
    );

    toast.success(`${selected.length} candidature(s) lancee(s)`);
  }

  // Bulk ignore
  async function handleBulkIgnore(selected: OfferRow[]) {
    await Promise.all(
      selected.map((o) =>
        fetch(`/api/offers/${o.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ignored" }),
        })
      )
    );
    toast.success(`${selected.length} offre(s) ignoree(s)`);
    fetchOffers();
  }

  const bulkActions: BulkAction<OfferRow>[] = [
    {
      label: "Postuler",
      icon: Send,
      onClick: handleBulkApply,
    },
    {
      label: "Ignorer",
      icon: EyeOff,
      variant: "outline",
      onClick: handleBulkIgnore,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offres d'emploi"
        description="Offres scrapees et scorees par l'agent"
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une offre..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <SearchJobCard />

      <OffersTable
        offers={offers}
        loading={loading}
        onRowClick={handleRowClick}
        enableSelection
        bulkActions={bulkActions}
      />

      <OfferSidePanel
        offer={selectedOffer}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onPrev={handlePrev}
        onNext={handleNext}
        onApplied={(id, jobId) => {
          updateOfferStatus(id, "apply_requested");
          if (jobId) {
            setTrackedApplyJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
          }
        }}
      />
      <ApplyJobsTray jobs={applyJobs} />
    </div>
  );
}
