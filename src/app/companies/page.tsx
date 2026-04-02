"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  sector: string;
  city: string;
  country: string;
  website: string | null;
  _count?: {
    contacts: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/companies${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
        <p className="text-sm text-gray-500 mt-1">
          Les entreprises dans votre pipeline
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Rechercher une entreprise..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          Chargement...
        </div>
      ) : companies.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center">
          Aucune entreprise trouv&eacute;e
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/companies/${c.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow block"
            >
              <h3 className="text-base font-semibold text-gray-900">
                {c.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{c.sector}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{c.city}, {c.country}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {c._count?.contacts ?? 0} contact(s)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
