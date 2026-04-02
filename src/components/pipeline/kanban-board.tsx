"use client";

import { useEffect, useState, useCallback } from "react";
import KanbanCard from "./kanban-card";

interface OutreachData {
  id: string;
  status: string;
  lastContactDate: string | null;
  contact: {
    firstName: string;
    lastName: string;
    priority: number;
    company: {
      name: string;
    };
  };
}

const COLUMNS = [
  { key: "identified", label: "Identifi\u00e9", color: "bg-gray-400" },
  { key: "contacted", label: "Contact\u00e9", color: "bg-blue-500" },
  { key: "followed_up", label: "Relanc\u00e9", color: "bg-yellow-500" },
  { key: "replied", label: "R\u00e9pondu", color: "bg-green-500" },
  { key: "entretien", label: "Entretien", color: "bg-purple-500" },
  { key: "offre", label: "Offre", color: "bg-emerald-500" },
];

export default function KanbanBoard() {
  const [outreaches, setOutreaches] = useState<OutreachData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutreaches = useCallback(() => {
    fetch("/api/outreaches")
      .then((r) => r.json())
      .then((data) => {
        setOutreaches(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOutreaches();
  }, [fetchOutreaches]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    const outreachId = e.dataTransfer.getData("text/plain");
    if (!outreachId) return;

    // Optimistic update
    setOutreaches((prev) =>
      prev.map((o) => (o.id === outreachId ? { ...o, status: newStatus } : o))
    );

    try {
      const res = await fetch(`/api/outreaches/${outreachId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Revert on error
      fetchOutreaches();
    }
  }

  if (loading) {
    return (
      <div className="text-gray-400 text-sm py-12 text-center">
        Chargement du pipeline...
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const items = outreaches.filter((o) => o.status === col.key);
        return (
          <div
            key={col.key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.key)}
            className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-3"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <h3 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h3>
              <span className="text-xs text-gray-400 ml-auto">
                {items.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {items.map((o) => (
                <KanbanCard
                  key={o.id}
                  id={o.id}
                  contactName={`${o.contact.firstName} ${o.contact.lastName}`}
                  companyName={o.contact.company.name}
                  priority={o.contact.priority}
                  lastContactDate={o.lastContactDate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
