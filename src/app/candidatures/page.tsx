"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import ApplicationsTable, {
  type ApplicationRow,
} from "@/components/applications/applications-table";
import { ApplicationSidePanel } from "@/components/applications/application-side-panel";

export default function CandidaturesPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    status: "",
    source: "",
  });

  // Side panel
  const [selectedApp, setSelectedApp] = useState<ApplicationRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Fetch applications
  const fetchApplications = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilters.status) params.set("status", activeFilters.status);
    if (activeFilters.source) params.set("source", activeFilters.source);
    const qs = params.toString();

    fetch(`/api/applications${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setApplications(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [search, activeFilters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filter config
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "status",
        label: "Statut",
        options: [
          { label: "Brouillon", value: "draft" },
          { label: "Postule", value: "applied" },
          { label: "Entretien", value: "interview" },
          { label: "Offre", value: "offer" },
          { label: "Accepte", value: "accepted" },
          { label: "Refuse", value: "rejected" },
          { label: "Retire", value: "withdrawn" },
        ],
      },
      {
        key: "source",
        label: "Source",
        options: [
          { label: "Manuel", value: "manual" },
          { label: "Scraping", value: "scraping" },
          { label: "Referral", value: "referral" },
          { label: "LinkedIn", value: "linkedin" },
        ],
      },
    ],
    []
  );

  // Side panel navigation
  const selectedIndex = selectedApp
    ? applications.findIndex((a) => a.id === selectedApp.id)
    : -1;

  const handlePrev =
    selectedIndex > 0
      ? () => {
          const prev = applications[selectedIndex - 1];
          setSelectedApp(prev);
        }
      : undefined;

  const handleNext =
    selectedIndex < applications.length - 1
      ? () => {
          const next = applications[selectedIndex + 1];
          setSelectedApp(next);
        }
      : undefined;

  const handleRowClick = (application: ApplicationRow) => {
    setSelectedApp(application);
    setPanelOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveFilters({ status: "", source: "" });
  };

  const handleUpdated = (updated: ApplicationRow) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedApp(updated);
  };

  const handleDeleted = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidatures"
        description="Suivi de toutes les candidatures"
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une candidature..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <ApplicationsTable
        applications={applications}
        loading={loading}
        onRowClick={handleRowClick}
      />

      <ApplicationSidePanel
        application={selectedApp}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onPrev={handlePrev}
        onNext={handleNext}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
