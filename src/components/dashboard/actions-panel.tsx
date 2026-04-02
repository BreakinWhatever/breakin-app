"use client";

import { useEffect, useState, useCallback } from "react";

interface Suggestion {
  id: string;
  subject: string;
  body: string;
  status: string;
  outreach: {
    id: string;
    campaignId: string;
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

interface ActionsPanelProps {
  campaignId?: string;
}

export default function ActionsPanel({ campaignId }: ActionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);

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

      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-400 text-sm py-8 text-center">
          Aucune suggestion en attente. Lancez l&apos;agent pour g&eacute;n&eacute;rer des brouillons.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
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
