"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  targetRole: string;
  targetCity: string;
  status: string;
  createdAt: string;
  template: {
    name: string;
  } | null;
  _count: {
    outreaches: number;
  };
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft: { label: "Brouillon", classes: "bg-gray-100 text-gray-600" },
  active: { label: "Active", classes: "bg-green-100 text-green-700" },
  paused: { label: "En pause", classes: "bg-yellow-100 text-yellow-700" },
};

export default function CampaignList({ refreshKey }: { refreshKey?: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return <div className="text-gray-400 text-sm py-8 text-center">Chargement...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-gray-400 text-sm py-8 text-center">
        Aucune campagne. Cr&eacute;ez-en une pour commencer.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => {
        const config = statusConfig[c.status] || statusConfig.draft;
        return (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow block"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {c.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {c.targetRole} &middot; {c.targetCity}
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.classes}`}
              >
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>{c._count.outreaches} contact(s)</span>
              {c.template && <span>Template: {c.template.name}</span>}
              <span>
                Cr&eacute;&eacute;e le{" "}
                {new Date(c.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
