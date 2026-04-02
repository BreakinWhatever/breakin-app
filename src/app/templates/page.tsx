"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

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

      {loading ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          Chargement...
        </div>
      ) : templates.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          Aucun template. Cr&eacute;ez-en un pour commencer.
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
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
                    title="Aper\u00e7u"
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
