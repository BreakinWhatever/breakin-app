"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Send, Loader2, CheckCircle2, XCircle, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import OffersTable, { type OfferRow } from "@/components/offers/offers-table";
import { OfferSidePanel, type OfferPanelData } from "@/components/offers/offer-side-panel";
import { type BulkAction } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ApplyProgress {
  offerId: string;
  company: string;
  role: string;
  status: "pending" | "applying" | "done" | "error";
  message?: string;
}

export default function OffresPage() {
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyQueue, setApplyQueue] = useState<ApplyProgress[]>([]);

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

  // Bulk apply
  async function handleBulkApply(selected: OfferRow[]) {
    const queue: ApplyProgress[] = selected.map((o) => ({
      offerId: o.id,
      company: o.company,
      role: o.title,
      status: "pending" as const,
    }));
    setApplyQueue(queue);

    for (let i = 0; i < queue.length; i++) {
      setApplyQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "applying", message: "Candidature en cours..." } : item
        )
      );

      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId: queue[i].offerId,
            companyName: queue[i].company,
            role: queue[i].role,
            source: "scraping",
            status: "applied",
            notes: "Candidature lancee depuis /offres",
          }),
        });

        if (!res.ok) throw new Error("Failed");

        // Update offer status
        await fetch(`/api/offers/${queue[i].offerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "applied" }),
        });

        setApplyQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "done", message: "Candidature creee" } : item
          )
        );
      } catch {
        setApplyQueue((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "error", message: "Erreur" } : item
          )
        );
      }
    }

    toast.success(`${queue.length} candidature(s) creee(s)`);
    fetchOffers();
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

      <OffersTable
        offers={offers}
        loading={loading}
        onRowClick={handleRowClick}
        enableSelection
        bulkActions={bulkActions}
      />

      {/* Apply Progress Tracker */}
      {applyQueue.length > 0 && (
        <Card className="max-w-lg fixed bottom-6 right-6 z-50 shadow-lg border-2">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Candidatures en cours</h3>
              {applyQueue.every((a) => a.status === "done" || a.status === "error") && (
                <button
                  onClick={() => setApplyQueue([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Fermer
                </button>
              )}
            </div>
            {applyQueue.map((item) => (
              <div key={item.offerId} className="flex items-center gap-2 text-sm">
                {item.status === "pending" && (
                  <div className="size-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                {item.status === "applying" && (
                  <Loader2 className="size-4 text-blue-500 animate-spin shrink-0" />
                )}
                {item.status === "done" && (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                )}
                {item.status === "error" && (
                  <XCircle className="size-4 text-red-500 shrink-0" />
                )}
                <span className="truncate flex-1">
                  {item.company} — {item.role}
                </span>
                {item.status === "applying" && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    En cours
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
