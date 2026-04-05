"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import ContactsTable, {
  type ContactRow,
} from "@/components/contacts/contacts-table";
import { ContactSidePanel } from "@/components/contacts/contact-side-panel";
import ApolloImportDialog from "@/components/contacts/apollo-import-dialog";
import { Button } from "@/components/ui/button";

interface Company {
  id: string;
  name: string;
}

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
    if (activeFilters.companyId) params.set("companyId", activeFilters.companyId);
    if (activeFilters.source) params.set("source", activeFilters.source);
    if (activeFilters.priority) params.set("priority", activeFilters.priority);
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

  const handleImported = () => {
    fetchContacts();
  };

  return (
    <div className="space-y-4">
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
      />

      <ContactsTable
        contacts={contacts}
        loading={loading}
        onRowClick={handleRowClick}
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
