"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Email {
  id: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface Outreach {
  id: string;
  status: string;
  campaignId: string;
  lastContactDate: string | null;
  emails: Email[];
}

interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  linkedinUrl: string | null;
  priority: number;
  source: string;
  notes: string | null;
  company: {
    id: string;
    name: string;
    sector: string;
    city: string;
  };
  outreaches: Outreach[];
}

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuv\u00e9",
  sent: "Envoy\u00e9",
  ignored: "Ignor\u00e9",
};

export default function ContactDetailPage() {
  const params = useParams();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/contacts/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setContact(null);
        } else {
          setContact(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="text-gray-400 text-sm py-12 text-center">Chargement...</div>;
  }

  if (!contact) {
    return <div className="text-gray-400 text-sm py-12 text-center">Contact introuvable</div>;
  }

  const allEmails = contact.outreaches.flatMap((o) =>
    o.emails.map((e) => ({ ...e, outreachStatus: o.status }))
  );
  allEmails.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/contacts" className="text-sm text-blue-600 hover:text-blue-700">
          &larr; Retour aux contacts
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-gray-500 mt-1">{contact.title}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              priorityColors[contact.priority] || priorityColors[3]
            }`}
          >
            P{contact.priority}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Email</p>
            <p className="text-sm text-gray-900 mt-1">{contact.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">
              Entreprise
            </p>
            <Link
              href={`/companies/${contact.company.id}`}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
            >
              {contact.company.name}
            </Link>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Source</p>
            <p className="text-sm text-gray-900 mt-1 capitalize">{contact.source}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">LinkedIn</p>
            {contact.linkedinUrl ? (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 mt-1 block truncate"
              >
                Profil LinkedIn
              </a>
            ) : (
              <p className="text-sm text-gray-400 mt-1">-</p>
            )}
          </div>
        </div>

        {contact.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-700">{contact.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historique des emails
        </h2>
        {allEmails.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Aucun email envoy&eacute;
          </p>
        ) : (
          <div className="space-y-3">
            {allEmails.map((email) => (
              <div
                key={email.id}
                className="border border-gray-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {email.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        email.status === "sent"
                          ? "bg-green-100 text-green-700"
                          : email.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {statusLabels[email.status] || email.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(email.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {email.subject}
                </p>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap line-clamp-3">
                  {email.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
