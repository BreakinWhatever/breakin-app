"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  priority: number;
}

interface CompanyDetail {
  id: string;
  name: string;
  sector: string;
  size: string;
  city: string;
  country: string;
  website: string | null;
  notes: string | null;
  contacts: Contact[];
}

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-gray-100 text-gray-600",
};

export default function CompanyDetailPage() {
  const params = useParams();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/companies/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setCompany(null);
        } else {
          setCompany(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="text-gray-400 text-sm py-12 text-center">Chargement...</div>;
  }

  if (!company) {
    return <div className="text-gray-400 text-sm py-12 text-center">Entreprise introuvable</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/companies" className="text-sm text-blue-600 hover:text-blue-700">
          &larr; Retour aux entreprises
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
        <p className="text-gray-500 mt-1">{company.sector}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Ville</p>
            <p className="text-sm text-gray-900 mt-1">{company.city}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Pays</p>
            <p className="text-sm text-gray-900 mt-1">{company.country}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Taille</p>
            <p className="text-sm text-gray-900 mt-1">{company.size || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium">Site web</p>
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 mt-1 block truncate"
              >
                {company.website}
              </a>
            ) : (
              <p className="text-sm text-gray-400 mt-1">-</p>
            )}
          </div>
        </div>

        {company.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 uppercase font-medium mb-1">Notes</p>
            <p className="text-sm text-gray-700">{company.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contacts ({company.contacts.length})
        </h2>
        {company.contacts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Aucun contact dans cette entreprise
          </p>
        ) : (
          <div className="space-y-3">
            {company.contacts.map((c) => (
              <Link
                key={c.id}
                href={`/contacts/${c.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors block"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{c.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{c.email}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      priorityColors[c.priority] || priorityColors[3]
                    }`}
                  >
                    P{c.priority}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
