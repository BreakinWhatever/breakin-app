"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import OffersTable, { type OfferRow } from "@/components/offers/offers-table";
import { OfferSidePanel, type OfferPanelData } from "@/components/offers/offer-side-panel";

export default function OffresPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    city: "",
    contractType: "",
    source: "",
    status: "",
  });

  // Side panel
  const [selectedOffer, setSelectedOffer] = useState<OfferPanelData | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Fetch offers
  const fetchOffers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilters.city) params.set("city", activeFilters.city);
    if (activeFilters.contractType) params.set("contractType", activeFilters.contractType);
    if (activeFilters.source) params.set("source", activeFilters.source);
    if (activeFilters.status) params.set("status", activeFilters.status);
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
          { label: "Postule", value: "applied" },
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
    setActiveFilters({ city: "", contractType: "", source: "", status: "" });
  };

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

      <OffersTable
        offers={offers}
        loading={loading}
        onRowClick={handleRowClick}
      />

      <OfferSidePanel
        offer={selectedOffer}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
