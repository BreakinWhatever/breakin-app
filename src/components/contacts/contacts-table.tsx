"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  priority: number;
  source: string;
  company: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-gray-100 text-gray-600",
};

export default function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        setCompanies(Array.isArray(data) ? data : []);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCompany) params.set("companyId", filterCompany);
    if (filterSource) params.set("source", filterSource);
    if (filterPriority) params.set("priority", filterPriority);
    const qs = params.toString();
    fetch(`/api/contacts${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        setContacts(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [search, filterCompany, filterSource, filterPriority]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <input
          type="text"
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Toutes les entreprises</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Toutes les sources</option>
            <option value="apollo">Apollo</option>
            <option value="manual">Manuel</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Toutes les priorit&eacute;s</option>
            <option value="1">P1</option>
            <option value="2">P2</option>
            <option value="3">P3</option>
            <option value="4">P4</option>
            <option value="5">P5</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Nom
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Titre
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Entreprise
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Email
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Priorit&eacute;
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                  Chargement...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                  Aucun contact trouv&eacute;
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${c.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {c.firstName} {c.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.title}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${c.company.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {c.company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        priorityColors[c.priority] || priorityColors[3]
                      }`}
                    >
                      P{c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                    {c.source}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
