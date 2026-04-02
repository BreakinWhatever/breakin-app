"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import CampaignForm from "@/components/campaigns/campaign-form";

interface Email {
  id: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
}

interface Outreach {
  id: string;
  status: string;
  campaignId: string;
  emails: Email[];
}

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

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/outreaches").then((r) => r.json()),
    ])
      .then(([campaignData, outreachData]) => {
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
        setOutreaches(Array.isArray(outreachData) ? outreachData : []);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Compute stats per campaign
  const campaignStats = useMemo(() => {
    const stats: Record<
      string,
      {
        contacts: number;
        sent: number;
        opened: number;
        replied: number;
        interviews: number;
      }
    > = {};

    for (const c of campaigns) {
      stats[c.id] = {
        contacts: c._count.outreaches,
        sent: 0,
        opened: 0,
        replied: 0,
        interviews: 0,
      };
    }

    for (const o of outreaches) {
      const s = stats[o.campaignId];
      if (!s) continue;

      if (o.status === "interview" || o.status === "entretien") {
        s.interviews++;
      }

      if (o.emails) {
        for (const e of o.emails) {
          if (e.status === "sent") {
            s.sent++;
            if (e.openedAt) s.opened++;
            if (e.repliedAt) s.replied++;
          }
        }
      }
    }

    return stats;
  }, [campaigns, outreaches]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerez vos campagnes de prospection
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Nouvelle campagne
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Campagne
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Statut
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Template
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Contacts
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Envoyes
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Taux d&apos;ouverture
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Taux de reponse
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">
                  Entretiens
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-gray-400 text-sm"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-gray-400 text-sm"
                  >
                    Aucune campagne. Creez-en une pour commencer.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const config = statusConfig[c.status] || statusConfig.draft;
                  const s = campaignStats[c.id] || {
                    contacts: 0,
                    sent: 0,
                    opened: 0,
                    replied: 0,
                    interviews: 0,
                  };
                  const openRate =
                    s.sent > 0 ? Math.round((s.opened / s.sent) * 100) : 0;
                  const replyRate =
                    s.sent > 0 ? Math.round((s.replied / s.sent) * 100) : 0;

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.targetRole} &middot; {c.targetCity}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.classes}`}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {c.template?.name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {s.contacts}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {s.sent}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={
                            openRate > 0
                              ? "text-green-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {openRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={
                            replyRate > 0
                              ? "text-purple-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {replyRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span
                          className={
                            s.interviews > 0
                              ? "text-yellow-600 font-medium"
                              : "text-gray-400"
                          }
                        >
                          {s.interviews}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CampaignForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
