"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Email {
  id: string;
  type: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
}

interface Outreach {
  id: string;
  status: string;
  lastContactDate: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    priority: number;
    company: {
      id: string;
      name: string;
    };
  };
  emails: Email[];
}

interface CampaignDetail {
  id: string;
  name: string;
  targetRole: string;
  targetCity: string;
  status: string;
  createdAt: string;
  template: {
    name: string;
  } | null;
  outreaches: Outreach[];
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft: { label: "Brouillon", classes: "bg-gray-100 text-gray-600" },
  active: { label: "Active", classes: "bg-green-100 text-green-700" },
  paused: { label: "En pause", classes: "bg-yellow-100 text-yellow-700" },
};

const outreachStatusLabels: Record<string, string> = {
  identified: "Identifi\u00e9",
  contacted: "Contact\u00e9",
  followed_up: "Relanc\u00e9",
  replied: "R\u00e9pondu",
  entretien: "Entretien",
  offre: "Offre",
};

const outreachStatusColors: Record<string, string> = {
  identified: "bg-gray-100 text-gray-600",
  contacted: "bg-blue-100 text-blue-700",
  followed_up: "bg-yellow-100 text-yellow-700",
  replied: "bg-green-100 text-green-700",
  entretien: "bg-purple-100 text-purple-700",
  offre: "bg-emerald-100 text-emerald-700",
};

const pipelineBarColors: Record<string, string> = {
  identified: "bg-gray-400",
  contacted: "bg-blue-500",
  followed_up: "bg-yellow-500",
  replied: "bg-green-500",
  entretien: "bg-purple-500",
  offre: "bg-emerald-500",
};

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-gray-100 text-gray-600",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setCampaign(null);
        } else {
          setCampaign(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="text-gray-400 text-sm py-12 text-center">Chargement...</div>;
  }

  if (!campaign) {
    return <div className="text-gray-400 text-sm py-12 text-center">Campagne introuvable</div>;
  }

  const config = statusConfig[campaign.status] || statusConfig.draft;

  // Compute real stats
  const totalContacts = campaign.outreaches.length;
  const allEmails = campaign.outreaches.flatMap((o) => o.emails);
  const sentEmails = allEmails.filter((e) => e.status === "sent");
  const emailsSent = sentEmails.length;
  const openedEmails = sentEmails.filter((e) => e.openedAt);
  const openRate =
    emailsSent > 0 ? Math.round((openedEmails.length / emailsSent) * 100) : 0;
  const repliedEmails = sentEmails.filter((e) => e.repliedAt);
  const replyRate =
    emailsSent > 0 ? Math.round((repliedEmails.length / emailsSent) * 100) : 0;
  const interviews = campaign.outreaches.filter(
    (o) => o.status === "entretien" || o.status === "interview"
  ).length;

  // Pipeline counts per status
  const pipelineStatuses = [
    "identified",
    "contacted",
    "followed_up",
    "replied",
    "entretien",
    "offre",
  ];
  const pipelineCounts = pipelineStatuses.map((s) => ({
    key: s,
    label: outreachStatusLabels[s] || s,
    count: campaign.outreaches.filter((o) => o.status === s).length,
    color: pipelineBarColors[s] || "bg-gray-400",
  }));
  const totalForBar = pipelineCounts.reduce((acc, p) => acc + p.count, 0);

  const statsCards = [
    {
      label: "Contacts",
      value: totalContacts,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Emails envoy\u00e9s",
      value: emailsSent,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Taux d'ouverture",
      value: `${openRate}%`,
      sub: `${openedEmails.length}/${emailsSent}`,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Taux de r\u00e9ponse",
      value: `${replyRate}%`,
      sub: `${repliedEmails.length}/${emailsSent}`,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Entretiens",
      value: interviews,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/campaigns" className="text-sm text-blue-600 hover:text-blue-700">
          &larr; Retour aux campagnes
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-500 mt-1">
              {campaign.targetRole} &middot; {campaign.targetCity}
            </p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.classes}`}>
            {config.label}
          </span>
        </div>

        <div className="text-xs text-gray-400 mt-2">
          Template : {campaign.template?.name || "-"}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <p className="text-xs text-gray-400 uppercase font-medium">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Pipeline mini-view */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Pipeline</h2>
        {totalForBar > 0 ? (
          <>
            <div className="flex rounded-lg overflow-hidden h-6">
              {pipelineCounts
                .filter((p) => p.count > 0)
                .map((p) => (
                  <div
                    key={p.key}
                    className={`${p.color} flex items-center justify-center text-xs font-medium text-white`}
                    style={{
                      width: `${(p.count / totalForBar) * 100}%`,
                      minWidth: "2rem",
                    }}
                  >
                    {p.count}
                  </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {pipelineCounts.map((p) => (
                <div key={p.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <span>
                    {p.label} ({p.count})
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Aucun outreach</p>
        )}
      </div>

      {/* Outreaches table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Outreaches ({campaign.outreaches.length})
        </h2>
        {campaign.outreaches.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Aucun outreach dans cette campagne
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Contact
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Entreprise
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Statut
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Priorit&eacute;
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Emails
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                    Dernier contact
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaign.outreaches.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${o.contact.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {o.contact.firstName} {o.contact.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${o.contact.company.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {o.contact.company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          outreachStatusColors[o.status] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {outreachStatusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          priorityColors[o.contact.priority] || priorityColors[3]
                        }`}
                      >
                        P{o.contact.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {o.emails.length}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {o.lastContactDate
                        ? new Date(o.lastContactDate).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
