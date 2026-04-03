"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

interface Suggestion {
  id: string;
  subject: string;
  body: string;
  type: string;
  status: string;
  createdAt: string;
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

type TabKey = "tous" | "envois" | "relances" | "reponses";
type SortField = "contact" | "subject" | "campaign" | "type" | "date";
type SortDir = "asc" | "desc";

interface ActionsPanelProps {
  campaignId?: string;
}

/* ─── Email Modal (kept from original) ─── */

function EmailModal({
  suggestion,
  onClose,
  onApprove,
  onIgnore,
  processing,
}: {
  suggestion: Suggestion;
  onClose: () => void;
  onApprove: (id: string) => void;
  onIgnore: (id: string) => void;
  processing: boolean;
}) {
  const [editedSubject, setEditedSubject] = useState(suggestion.subject);
  const [editedBody, setEditedBody] = useState(suggestion.body);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/emails/${suggestion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: editedSubject, body: editedBody }),
    });
    setSaving(false);
    setEditing(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {suggestion.outreach.contact.firstName}{" "}
                {suggestion.outreach.contact.lastName}
              </h2>
              <p className="text-sm text-gray-500">
                {suggestion.outreach.contact.company.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              x
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              Objet
            </label>
            {editing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900 mt-1">
                {editedSubject}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide">
              Corps du mail
            </label>
            {editing ? (
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={12}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
            ) : (
              <div className="mt-1 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {editedBody}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <div>
            {editing ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Modifier
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onIgnore(suggestion.id)}
              disabled={processing}
              className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Ignorer
            </button>
            <button
              onClick={() => onApprove(suggestion.id)}
              disabled={processing}
              className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? "Envoi..." : "Approuver & Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Type badge ─── */

function TypeBadge({ type }: { type: string }) {
  if (type === "followup") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
        Relance
      </span>
    );
  }
  if (type === "reponse" || type === "reply") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
        Reponse
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
      Initial
    </span>
  );
}

/* ─── Sort arrow ─── */

function SortArrow({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (field !== sortField) return null;
  return (
    <span className="ml-1 inline-block text-gray-400">
      {sortDir === "asc" ? "\u25B2" : "\u25BC"}
    </span>
  );
}

/* ─── Helpers ─── */

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function contactSortValue(s: Suggestion) {
  return `${s.outreach.contact.lastName} ${s.outreach.contact.firstName}`.toLowerCase();
}

const PAGE_SIZE = 10;

/* ─── Main component ─── */

export default function ActionsPanel({ campaignId }: ActionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("tous");
  const [selectedEmail, setSelectedEmail] = useState<Suggestion | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  /* ─── Fetch ─── */

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

  /* ─── Filtering ─── */

  const filtered = campaignId
    ? suggestions.filter((s) => s.outreach.campaignId === campaignId)
    : suggestions;

  const envois = useMemo(
    () =>
      filtered.filter(
        (s) => s.outreach.status === "identified" || s.type === "initial"
      ),
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
    { key: "tous", label: "Tous", items: filtered },
    { key: "envois", label: "Envois", items: envois },
    { key: "relances", label: "Relances", items: relances },
    { key: "reponses", label: "Reponses", items: reponses },
  ];

  const activeItems = tabs.find((t) => t.key === activeTab)?.items ?? [];

  /* ─── Search ─── */

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return activeItems;
    const q = searchQuery.toLowerCase();
    return activeItems.filter(
      (s) =>
        s.outreach.contact.firstName.toLowerCase().includes(q) ||
        s.outreach.contact.lastName.toLowerCase().includes(q) ||
        s.outreach.contact.company.name.toLowerCase().includes(q)
    );
  }, [activeItems, searchQuery]);

  /* ─── Sort ─── */

  const sorted = useMemo(() => {
    const arr = [...searched];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      switch (sortField) {
        case "contact":
          return contactSortValue(a).localeCompare(contactSortValue(b)) * dir;
        case "subject":
          return a.subject.localeCompare(b.subject) * dir;
        case "campaign":
          return a.outreach.campaign.name.localeCompare(b.outreach.campaign.name) * dir;
        case "type":
          return a.type.localeCompare(b.type) * dir;
        case "date":
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            dir
          );
        default:
          return 0;
      }
    });
    return arr;
  }, [searched, sortField, sortDir]);

  /* ─── Pagination ─── */

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, searchQuery]);

  /* ─── Selection ─── */

  const visibleIds = paged.map((s) => s.id);
  const allVisibleSelected =
    paged.length > 0 && paged.every((s) => selectedIds.has(s.id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Count how many selected ids are still in the current filtered view
  const selectedCount = sorted.filter((s) => selectedIds.has(s.id)).length;

  /* ─── Sort handler ─── */

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  /* ─── Actions ─── */

  async function handleApproveAndSend(emailId: string) {
    setProcessing(emailId);
    try {
      const approveRes = await fetch(`/api/emails/${emailId}/approve`, {
        method: "POST",
      });
      if (!approveRes.ok) throw new Error("Failed to approve");

      const sendRes = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
      });
      if (!sendRes.ok) {
        const err = await sendRes.json();
        throw new Error(err.error || "Failed to send");
      }

      setSuggestions((prev) => prev.filter((s) => s.id !== emailId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
    } catch {
      alert("Error ignoring email");
    } finally {
      setProcessing(null);
    }
  }

  async function handleBulkApprove() {
    const ids = sorted.filter((s) => selectedIds.has(s.id)).map((s) => s.id);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    try {
      for (const id of ids) {
        const approveRes = await fetch(`/api/emails/${id}/approve`, {
          method: "POST",
        });
        if (!approveRes.ok) continue;
        const sendRes = await fetch(`/api/emails/${id}/send`, {
          method: "POST",
        });
        if (sendRes.ok) {
          setSuggestions((prev) => prev.filter((s) => s.id !== id));
        }
      }
      setSelectedIds(new Set());
    } catch {
      alert("Erreur lors de l'envoi groupé");
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleBulkIgnore() {
    const ids = sorted.filter((s) => selectedIds.has(s.id)).map((s) => s.id);
    if (ids.length === 0) return;
    setBulkProcessing(true);
    try {
      for (const id of ids) {
        await fetch(`/api/emails/${id}/approve`, { method: "POST" });
        setSuggestions((prev) => prev.filter((s) => s.id !== id));
      }
      setSelectedIds(new Set());
    } catch {
      alert("Erreur lors de l'action groupée");
    } finally {
      setBulkProcessing(false);
    }
  }

  /* ─── Column header helper ─── */

  const thClass =
    "px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700 transition-colors";

  /* ─── Render ─── */

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 pb-0">
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

        {/* Tabs + Search row */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100">
          <div className="flex">
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

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-gray-400 text-sm py-16 text-center">
          Chargement...
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-gray-400 text-sm py-16 text-center">
          {searchQuery
            ? "Aucun resultat pour cette recherche."
            : activeTab === "envois"
              ? "Aucun envoi initial en attente."
              : activeTab === "relances"
                ? "Aucune relance en attente."
                : activeTab === "reponses"
                  ? "Aucune reponse en attente."
                  : "Aucune suggestion en attente."}{" "}
          Lancez l&apos;agent pour generer des brouillons.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className={thClass} onClick={() => handleSort("contact")}>
                    Contact
                    <SortArrow field="contact" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("subject")}>
                    Objet
                    <SortArrow field="subject" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("campaign")}>
                    Campagne
                    <SortArrow field="campaign" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("type")}>
                    Type
                    <SortArrow field="type" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className={thClass} onClick={() => handleSort("date")}>
                    Date
                    <SortArrow field="date" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((s) => {
                  const isSelected = selectedIds.has(s.id);
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedEmail(s)}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {s.outreach.contact.firstName}{" "}
                          {s.outreach.contact.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.outreach.contact.company.name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 truncate max-w-[220px]">
                          {s.subject}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {s.outreach.campaign.name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={s.type} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(s.createdAt)}
                        </p>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApproveAndSend(s.id)}
                            disabled={processing === s.id}
                            className="text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                            title="Approuver & Envoyer"
                          >
                            {processing === s.id ? "..." : "Envoyer"}
                          </button>
                          <button
                            onClick={() => handleIgnore(s.id)}
                            disabled={processing === s.id}
                            className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                            title="Ignorer"
                          >
                            Ignorer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {safePage * PAGE_SIZE + 1}-
                {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} sur{" "}
                {sorted.length} resultats
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Precedent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-6 py-3 flex items-center justify-between z-10">
          <p className="text-sm text-gray-700 font-medium">
            {selectedCount} email{selectedCount > 1 ? "s" : ""} selectionne
            {selectedCount > 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleBulkIgnore}
              disabled={bulkProcessing}
              className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Ignorer ({selectedCount})
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={bulkProcessing}
              className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {bulkProcessing
                ? "Envoi en cours..."
                : `Approuver & Envoyer (${selectedCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Email modal */}
      {selectedEmail && (
        <EmailModal
          suggestion={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onApprove={(id) => {
            handleApproveAndSend(id);
            setSelectedEmail(null);
          }}
          onIgnore={(id) => {
            handleIgnore(id);
            setSelectedEmail(null);
          }}
          processing={processing === selectedEmail.id}
        />
      )}
    </div>
  );
}
