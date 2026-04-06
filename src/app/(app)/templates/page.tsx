"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import TemplateEditor from "@/components/templates/template-editor";
import TemplatePreview from "@/components/templates/template-preview";

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  subject: string;
  body: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  initial: "Initial",
  followup_1: "Relance 1",
  followup_2: "Relance 2",
  followup_3: "Relance 3",
};

const JOB_TYPES: FilterConfig = {
  key: "jobType",
  label: "Type de metier",
  options: [
    { value: "Private Debt", label: "Private Debt" },
    { value: "Private Credit", label: "Private Credit" },
    { value: "Debt Advisory", label: "Debt Advisory" },
    { value: "Leverage Finance", label: "Leverage Finance" },
    { value: "Transaction Services", label: "Transaction Services" },
    { value: "Private Equity", label: "Private Equity" },
    { value: "M&A", label: "M&A" },
  ],
};

const LANGUAGES_FILTER: FilterConfig = {
  key: "language",
  label: "Langue",
  options: [
    { value: "fr", label: "FR" },
    { value: "en", label: "EN" },
  ],
};

const CATEGORIES_FILTER: FilterConfig = {
  key: "category",
  label: "Categorie",
  options: [
    { value: "initial", label: "Initial" },
    { value: "followup_1", label: "Relance 1" },
    { value: "followup_2", label: "Relance 2" },
  ],
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    jobType: "",
    language: "",
    category: "",
  });

  const fetchTemplates = useCallback(() => {
    setLoading(true);
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) &&
          !t.subject.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (activeFilters.jobType && !t.name.toLowerCase().includes(activeFilters.jobType.toLowerCase())) {
        return false;
      }
      if (activeFilters.language && t.language !== activeFilters.language) {
        return false;
      }
      if (activeFilters.category && t.category !== activeFilters.category) {
        return false;
      }
      return true;
    });
  }, [templates, search, activeFilters]);

  function handleNew() {
    setEditingTemplate(null);
    setShowEditor(true);
  }

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setShowEditor(true);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Template supprime");
      fetchTemplates();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Modeles d'emails pour vos campagnes"
        actions={
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-1" />
            Nouveau template
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un template..."
        filters={[JOB_TYPES, LANGUAGES_FILTER, CATEGORIES_FILTER]}
        activeFilters={activeFilters}
        onFilterChange={(key, value) =>
          setActiveFilters((prev) => ({ ...prev, [key]: value }))
        }
        onClearFilters={() =>
          setActiveFilters({ jobType: "", language: "", category: "" })
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={templates.length === 0 ? "Aucun template" : "Aucun resultat"}
          description={
            templates.length === 0
              ? "Creez votre premier template pour commencer."
              : "Aucun template ne correspond aux filtres selectionnes."
          }
          actionLabel={templates.length === 0 ? "Nouveau template" : undefined}
          onAction={templates.length === 0 ? handleNew : undefined}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} template{filtered.length > 1 ? "s" : ""}{" "}
            {filtered.length !== templates.length && `sur ${templates.length}`}
          </p>
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{t.name}</h3>
                      <Badge variant="secondary">
                        {t.language.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {categoryLabels[t.category] || t.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Objet : {t.subject}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {t.body.slice(0, 120)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setPreviewTemplate(t)}
                      title="Apercu"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(t)}
                      title="Modifier"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(t.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TemplateEditor
        open={showEditor}
        template={editingTemplate}
        onClose={() => setShowEditor(false)}
        onSaved={fetchTemplates}
      />

      {previewTemplate && (
        <TemplatePreview
          subject={previewTemplate.subject}
          body={previewTemplate.body}
          open={true}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  );
}
