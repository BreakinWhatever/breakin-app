"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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

const JOB_TYPES = [
  { value: "", label: "Tous les metiers" },
  { value: "Private Debt", label: "Private Debt" },
  { value: "Debt Advisory", label: "Debt Advisory" },
  { value: "LevFin", label: "LevFin" },
  { value: "TS", label: "TS" },
  { value: "PE", label: "PE" },
  { value: "M&A", label: "M&A" },
];

const LANGUAGES = [
  { value: "", label: "Toutes les langues" },
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
];

const CATEGORIES = [
  { value: "", label: "Toutes les categories" },
  { value: "initial", label: "Initial" },
  { value: "followup_1", label: "Relance 1" },
  { value: "followup_2", label: "Relance 2" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const [filterJobType, setFilterJobType] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

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
      if (filterJobType && !t.name.toLowerCase().includes(filterJobType.toLowerCase())) {
        return false;
      }
      if (filterLanguage && t.language !== filterLanguage) {
        return false;
      }
      if (filterCategory && t.category !== filterCategory) {
        return false;
      }
      return true;
    });
  }, [templates, filterJobType, filterLanguage, filterCategory]);

  function handleNew() {
    setEditingTemplate(null);
    setShowEditor(true);
  }

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setShowEditor(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce template ?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchTemplates();
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mod&egrave;les d&apos;emails pour vos campagnes
          </p>
        </div>
        <button
          onClick={handleNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Nouveau template
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
              Type de metier
            </label>
            <select
              value={filterJobType}
              onChange={(e) => setFilterJobType(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {JOB_TYPES.map((jt) => (
                <option key={jt.value} value={jt.value}>
                  {jt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Langue
            </label>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Categorie
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {(filterJobType || filterLanguage || filterCategory) && (
            <button
              onClick={() => {
                setFilterJobType("");
                setFilterLanguage("");
                setFilterCategory("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
            >
              Reinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          {templates.length === 0
            ? "Aucun template. Creez-en un pour commencer."
            : "Aucun template ne correspond aux filtres selectionnes."}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {filtered.length} template{filtered.length > 1 ? "s" : ""}{" "}
            {filtered.length !== templates.length && `sur ${templates.length}`}
          </p>
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {t.name}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {t.language.toUpperCase()}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {categoryLabels[t.category] || t.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Objet : {t.subject}
                  </p>
                  <p className="text-sm text-gray-400 mt-1 truncate">
                    {t.body.slice(0, 120)}...
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    className="text-sm text-gray-500 hover:text-blue-600 px-2 py-1"
                    title="Apercu"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(t)}
                    className="text-sm text-gray-500 hover:text-blue-600 px-2 py-1"
                    title="Modifier"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-sm text-gray-500 hover:text-red-600 px-2 py-1"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
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
