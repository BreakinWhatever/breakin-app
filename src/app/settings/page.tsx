"use client";

import { useEffect, useState, useRef } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    maxEmailsPerDay: "20",
    sendOnWeekends: "false",
    followUpSpacing: "3,5,7",
    maxFollowUps: "3",
    defaultLanguage: "fr",
    apolloApiKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // CV upload state
  const [cvInfo, setCvInfo] = useState<{
    exists: boolean;
    filename?: string;
    path?: string;
  }>({ exists: false });
  const [cvUploading, setCvUploading] = useState(false);
  const [cvMessage, setCvMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .finally(() => setLoading(false));

    // Fetch CV info
    fetch("/api/cv")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setCvInfo(data);
        }
      });
  }, []);

  async function handleCvUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setCvMessage("Seuls les fichiers PDF sont acceptes.");
      return;
    }

    setCvUploading(true);
    setCvMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCvInfo(data);
      setCvMessage("CV uploade avec succes !");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setCvMessage(""), 3000);
    } catch {
      setCvMessage("Erreur lors de l'upload du CV.");
    } finally {
      setCvUploading(false);
    }
  }

  async function handleCvDelete() {
    if (!confirm("Supprimer le CV ?")) return;
    setCvUploading(true);
    setCvMessage("");
    try {
      const res = await fetch("/api/cv", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setCvInfo({ exists: false });
      setCvMessage("CV supprime.");
      setTimeout(() => setCvMessage(""), 3000);
    } catch {
      setCvMessage("Erreur lors de la suppression du CV.");
    } finally {
      setCvUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Erreur lors de la sauvegarde des param\u00e8tres");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return <div className="text-gray-400 text-sm py-12 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Param&egrave;tres</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurez le comportement de la plateforme
        </p>
      </div>

      {/* CV Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Curriculum Vitae
        </h2>

        {cvInfo.exists && cvInfo.filename && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
            <svg
              className="w-5 h-5 text-blue-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <a
              href={cvInfo.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline font-medium truncate"
            >
              {cvInfo.filename}
            </a>
            <button
              type="button"
              onClick={handleCvDelete}
              disabled={cvUploading}
              className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 shrink-0"
            >
              Supprimer
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
          />
          <button
            type="button"
            onClick={handleCvUpload}
            disabled={cvUploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors shrink-0"
          >
            {cvUploading ? "Upload..." : "Uploader"}
          </button>
        </div>

        {cvMessage && (
          <p
            className={`text-sm mt-3 ${
              cvMessage.includes("succes") || cvMessage.includes("supprime")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {cvMessage}
          </p>
        )}

        <p className="text-xs text-gray-400 mt-2">
          Fichier PDF uniquement. Ce CV sera utilise pour vos candidatures.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl"
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Emails max par jour
            </label>
            <input
              type="number"
              value={settings.maxEmailsPerDay}
              onChange={(e) => updateSetting("maxEmailsPerDay", e.target.value)}
              min="1"
              max="100"
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Limite quotidienne d&apos;envoi d&apos;emails
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Envoyer le week-end
            </label>
            <select
              value={settings.sendOnWeekends}
              onChange={(e) => updateSetting("sendOnWeekends", e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="false">Non</option>
              <option value="true">Oui</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Espacement des relances (jours)
            </label>
            <input
              type="text"
              value={settings.followUpSpacing}
              onChange={(e) => updateSetting("followUpSpacing", e.target.value)}
              placeholder="3,5,7"
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              D&eacute;lais entre chaque relance, s&eacute;par&eacute;s par des virgules
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nombre max de relances
            </label>
            <input
              type="number"
              value={settings.maxFollowUps}
              onChange={(e) => updateSetting("maxFollowUps", e.target.value)}
              min="1"
              max="10"
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Langue par d&eacute;faut
            </label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) => updateSetting("defaultLanguage", e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="fr">Fran&ccedil;ais</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Cl&eacute; API Apollo
            </label>
            <input
              type="password"
              value={settings.apolloApiKey}
              onChange={(e) => updateSetting("apolloApiKey", e.target.value)}
              placeholder="Votre cl\u00e9 API Apollo.io"
              className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">
              Param&egrave;tres sauvegard&eacute;s
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
