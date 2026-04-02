"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Email {
  id: string;
  type: string;
  status: string;
  sentAt: string | null;
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
  const totalEmails = campaign.outreaches.reduce(
    (acc, o) => acc + o.emails.length,
    0
  );
  const sentEmails = campaign.outreaches.reduce(
    (acc, o) => acc + o.emails.filter((e) => e.status === "sent").length,
    0
  );

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Contacts</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {campaign.outreaches.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Emails envoy&eacute;s</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{sentEmails}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Total emails</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{totalEmails}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Template</p>
            <p className="text-sm text-gray-900 mt-1">
              {campaign.template?.name || "-"}
            </p>
          </div>
        </div>
      </div>

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
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
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
