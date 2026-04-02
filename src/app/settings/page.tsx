"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

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
