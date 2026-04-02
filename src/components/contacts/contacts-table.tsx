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

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-gray-100 text-gray-600",
};

export default function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/contacts${params}`)
      .then((r) => r.json())
      .then((data) => {
        setContacts(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
