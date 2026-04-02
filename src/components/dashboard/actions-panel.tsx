"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

interface Suggestion {
  id: string;
  subject: string;
  body: string;
  type: string;
  status: string;
  outreach: {
    id: string;
    campaignId: string;
    status: string;
    contact: {
      firstName: string;
      lastName: string;
      company: {
        name: string;
      };
    };
    campaign: {
      name: string;
    };
  };
}

type TabKey = "envois" | "relances" | "reponses";

interface ActionsPanelProps {
  campaignId?: string;
}

export default function ActionsPanel({ campaignId }: ActionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("envois");

  const fetchSuggestions = useCallback(() => {
    setLoading(true);
    fetch("/api/agent/suggestions")
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Filter suggestions client-side by campaignId
  const filtered = campaignId
    ? suggestions.filter((s) => s.outreach.campaignId === campaignId)
    : suggestions;

  // Split into 3 categories
  const envois = useMemo(
    () => filtered.filter((s) => s.outreach.status === "identified" || s.type === "initial"),
    [filtered]
  );
  const relances = useMemo(
    () =>
      filtered.filter(
        (s) =>
          s.outreach.status === "contacted" ||
          s.outreach.status === "followed_up" ||
          s.outreach.status === "followup_1" ||
          s.outreach.status === "followup_2" ||
          s.outreach.status === "followup_3" ||
          s.type === "followup"
      ),
    [filtered]
  );
  const reponses = useMemo(
    () => filtered.filter((s) => s.outreach.status === "replied"),
    [filtered]
  );

  const tabs: { key: TabKey; label: string; items: Suggestion[] }[] = [
    { key: "envois", label: "Envois", items: envois },
    { key: "relances", label: "Relances", items: relances },
    { key: "reponses", label: "Reponses", items: reponses },
  ];

  const activeItems = tabs.find((t) => t.key === activeTab)?.items ?? [];

  async function handleApproveAndSend(emailId: string) {
    setProcessing(emailId);
    try {
      const approveRes = await fetch(`/api/emails/${emailId}/approve`, {
        method: "POST",
      });
      if (!approveRes.ok) {
        throw new Error("Failed to approve");
      }

      const sendRes = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
      });
      if (!sendRes.ok) {
        const err = await sendRes.json();
        throw new Error(err.error || "Failed to send");
      }

      setSuggestions((prev) => prev.filter((s) => s.id !== emailId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error processing email");
    } finally {
      setProcessing(null);
    }
  }

  async function handleIgnore(emailId: string) {
    setProcessing(emailId);
    try {
      await fetch(`/api/emails/${emailId}/approve`, { method: "POST" });
      setSuggestions((prev) => prev.filter((s) => s.id !== emailId));
    } catch {
      alert("Error ignoring email");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Suggestions de l&apos;agent
        </h2>
        <button
          onClick={() => {
            setAgentMessage(
              "Pour lancer l'agent, utilisez Claude Code avec la commande : \"lance l'agent\""
            );
            setTimeout(() => setAgentMessage(null), 5000);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Lancer l&apos;agent
        </button>
      </div>

      {agentMessage && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {agentMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                activeTab === tab.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {tab.items.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">
          Chargement...
        </div>
      ) : activeItems.length === 0 ? (
        <div className="text-gray-400 text-sm py-8 text-center">
          {activeTab === "envois" && "Aucun envoi initial en attente."}
          {activeTab === "relances" && "Aucune relance en attente."}
          {activeTab === "reponses" && "Aucune reponse en attente."}
          {" "}Lancez l&apos;agent pour generer des brouillons.
        </div>
      ) : (
        <div className="space-y-4">
          {activeItems.map((s) => (
            <div
              key={s.id}
              className="border border-gray-100 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {s.outreach.contact.firstName} {s.outreach.contact.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.outreach.contact.company.name}
                  </p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Brouillon
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {s.subject}
              </p>
              <p className="text-sm text-gray-500 whitespace-pre-wrap line-clamp-4">
                {s.body}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApproveAndSend(s.id)}
                  disabled={processing === s.id}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  {processing === s.id ? "..." : "Approuver & Envoyer"}
                </button>
                <button
                  onClick={() => handleIgnore(s.id)}
                  disabled={processing === s.id}
                  className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Ignorer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
