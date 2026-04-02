"use client";

import { useState, useEffect } from "react";

interface TemplateData {
  id?: string;
  name: string;
  language: string;
  category: string;
  subject: string;
  body: string;
}

interface TemplateEditorProps {
  open: boolean;
  template: TemplateData | null;
  onClose: () => void;
  onSaved: () => void;
}

const VARIABLES = [
  "{firstName}",
  "{lastName}",
  "{companyName}",
  "{role}",
  "{city}",
  "{senderName}",
];

export default function TemplateEditor({
  open,
  template,
  onClose,
  onSaved,
}: TemplateEditorProps) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("fr");
  const [category, setCategory] = useState("initial");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setLanguage(template.language);
      setCategory(template.category);
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setName("");
      setLanguage("fr");
      setCategory("initial");
      setSubject("");
      setBody("");
    }
  }, [template, open]);

  function insertVariable(variable: string) {
    setBody((prev) => prev + variable);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !subject || !body) return;

    setSaving(true);
    try {
      const isEdit = template?.id;
      const url = isEdit ? `/api/templates/${template.id}` : "/api/templates";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          language,
          category,
          subject,
          body,
        }),
      });

      if (!res.ok) throw new Error("Failed to save template");
      onSaved();
      onClose();
    } catch {
      alert("Erreur lors de la sauvegarde du template");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {template?.id ? "Modifier le template" : "Nouveau template"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Email initial FR"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Langue
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="fr">Fran&ccedil;ais</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Cat&eacute;gorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="initial">Initial</option>
                <option value="followup_1">Relance 1</option>
                <option value="followup_2">Relance 2</option>
                <option value="followup_3">Relance 3</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Objet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Candidature - {companyName}"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Corps du message
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              required
              placeholder="Bonjour {firstName},&#10;&#10;Je me permets de vous contacter..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
