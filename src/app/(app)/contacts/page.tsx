"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Upload, Trash2, Tags, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  FilterBar,
  type FilterConfig,
  type QuickFilter,
} from "@/components/shared/filter-bar";
import ContactsTable, {
  type ContactRow,
} from "@/components/contacts/contacts-table";
import { ContactSidePanel } from "@/components/contacts/contact-side-panel";
import ApolloImportDialog from "@/components/contacts/apollo-import-dialog";
import { Button } from "@/components/ui/button";
import { type BulkAction } from "@/components/shared/data-table";
import {
  exportToCsv,
  type CsvColumnMap,
} from "@/components/shared/csv-export";

interface Company {
  id: string;
  name: string;
}

// CSV column mapping for contacts
const contactCsvColumns: CsvColumnMap<ContactRow>[] = [
  { header: "Prenom", accessor: (r) => r.firstName },
  { header: "Nom", accessor: (r) => r.lastName },
  { header: "Titre", accessor: (r) => r.title },
  { header: "Email", accessor: (r) => r.email },
  { header: "Entreprise", accessor: (r) => r.company.name },
  { header: "Priorite", accessor: (r) => r.priority },
  { header: "Source", accessor: (r) => r.source },
  { header: "LinkedIn", accessor: (r) => r.linkedinUrl },
  { header: "Notes", accessor: (r) => r.notes },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    companyId: "",
    source: "",
    priority: "",
  });

  // Side panel
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(
    null
  );
  const [panelOpen, setPanelOpen] = useState(false);

  // Import dialog
  const [showImport, setShowImport] = useState(false);

  // Fetch companies for filter
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : []);
      });
  }, []);

  // Fetch contacts
  const fetchContacts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeFilters.companyId)
      params.set("companyId", activeFilters.companyId);
    if (activeFilters.source) params.set("source", activeFilters.source);
    if (activeFilters.priority)
      params.set("priority", activeFilters.priority);
    const qs = params.toString();

    fetch(`/api/contacts${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setContacts(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [search, activeFilters]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Filter config
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "companyId",
        label: "Entreprise",
        options: companies.map((c) => ({ label: c.name, value: c.id })),
      },
      {
        key: "source",
        label: "Source",
        options: [
          { label: "Apollo", value: "apollo" },
          { label: "Manuel", value: "manual" },
        ],
      },
      {
        key: "priority",
        label: "Priorite",
        options: [
          { label: "P1", value: "1" },
          { label: "P2", value: "2" },
          { label: "P3", value: "3" },
          { label: "P4", value: "4" },
          { label: "P5", value: "5" },
        ],
      },
    ],
    [companies]
  );

  // Quick filters
  const quickFilters: QuickFilter[] = useMemo(
    () => [
      {
        label: "Priorite haute (P1-P2)",
        filters: { companyId: "", source: "", priority: "1" },
      },
      {
        label: "Source Apollo",
        filters: { companyId: "", source: "apollo", priority: "" },
      },
    ],
    []
  );

  // Side panel navigation
  const selectedIndex = selectedContact
    ? contacts.findIndex((c) => c.id === selectedContact.id)
    : -1;

  const handlePrev =
    selectedIndex > 0
      ? () => {
          const prev = contacts[selectedIndex - 1];
          setSelectedContact(prev);
        }
      : undefined;

  const handleNext =
    selectedIndex < contacts.length - 1
      ? () => {
          const next = contacts[selectedIndex + 1];
          setSelectedContact(next);
        }
      : undefined;

  const handleRowClick = (contact: ContactRow) => {
    setSelectedContact(contact);
    setPanelOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearch("");
    setActiveFilters({ companyId: "", source: "", priority: "" });
  };

  const handleQuickFilter = (filters: Record<string, string>) => {
    setActiveFilters(filters);
  };

  const handleImported = () => {
    fetchContacts();
  };

  // Priority inline edit
  const handlePriorityChange = useCallback(
    (id: string, priority: number) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, priority } : c))
      );
    },
    []
  );

  // CSV export
  const handleExport = useCallback(
    (data: ContactRow[], selectedOnly: boolean) => {
      const filename = selectedOnly
        ? `contacts-selection-${new Date().toISOString().split("T")[0]}.csv`
        : `contacts-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCsv(filename, data, contactCsvColumns);
      toast.success(
        `${data.length} contact${data.length > 1 ? "s" : ""} exporte${data.length > 1 ? "s" : ""}`
      );
    },
    []
  );

  // Bulk actions
  const bulkActions: BulkAction<ContactRow>[] = useMemo(
    () => [
      {
        label: "Exporter CSV",
        icon: Download,
        onClick: (rows) => {
          exportToCsv(
            `contacts-selection-${new Date().toISOString().split("T")[0]}.csv`,
            rows,
            contactCsvColumns
          );
          toast.success(`${rows.length} contacts exportes`);
        },
      },
      {
        label: "Supprimer",
        icon: Trash2,
        variant: "destructive" as const,
        onClick: async (rows) => {
          if (
            !confirm(
              `Supprimer ${rows.length} contact${rows.length > 1 ? "s" : ""} ?`
            )
          )
            return;

          let deleted = 0;
          for (const row of rows) {
            try {
              const res = await fetch(`/api/contacts/${row.id}`, {
                method: "DELETE",
              });
              if (res.ok) deleted++;
            } catch {
              // continue
            }
          }

          toast.success(`${deleted} contact${deleted > 1 ? "s" : ""} supprime${deleted > 1 ? "s" : ""}`);
          fetchContacts();
        },
      },
    ],
    [fetchContacts]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        actions={
          <Button onClick={() => setShowImport(true)}>
            <Upload className="size-4 mr-1.5" />
            Importer depuis Apollo
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un contact..."
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        quickFilters={quickFilters}
        onQuickFilter={handleQuickFilter}
        presetStorageKey="contacts"
      />

      <ContactsTable
        contacts={contacts}
        loading={loading}
        onRowClick={handleRowClick}
        onPriorityChange={handlePriorityChange}
        enableSelection
        bulkActions={bulkActions}
        onExport={handleExport}
      />

      <ContactSidePanel
        contact={selectedContact}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <ApolloImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={handleImported}
      />
    </div>
  );
}
