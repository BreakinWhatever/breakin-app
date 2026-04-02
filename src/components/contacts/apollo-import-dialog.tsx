"use client";

import { useState } from "react";

interface ApolloResult {
  id: string;
  first_name: string;
  last_name: string;
  title: string;
  email: string | null;
  organization?: {
    name: string;
  };
}

interface ApolloImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ApolloImportDialog({
  open,
  onClose,
  onImported,
}: ApolloImportDialogProps) {
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Paris");
  const [sector, setSector] = useState("Private Credit");
  const [results, setResults] = useState<ApolloResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  async function handleSearch() {
    setSearching(true);
    setSearchDone(false);
    try {
      const res = await fetch("/api/apollo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, city, sector }),
      });
      const data = await res.json();
      const people = data.people || [];
      setResults(people);
      setSelected(new Set(people.map((_: ApolloResult, i: number) => i)));
      setSearchDone(true);
    } catch {
      alert("Erreur lors de la recherche Apollo");
    } finally {
      setSearching(false);
    }
  }

  async function handleImport() {
    const selectedPeople = results.filter((_, i) => selected.has(i));
    if (selectedPeople.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/apollo/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ people: selectedPeople }),
      });
      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      alert(
        `Import termin\u00e9 : ${data.created} cr\u00e9\u00e9(s), ${data.skipped} ignor\u00e9(s)`
      );
      onImported();
      onClose();
    } catch {
      alert("Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  }

  function toggleAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  }

  function toggleOne(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Importer depuis Apollo
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Titre / R&ocirc;le
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Analyst, Associate..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Ville
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Secteur
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {searching ? "Recherche..." : "Rechercher"}
          </button>
        </div>

        {searchDone && (
          <div className="flex-1 overflow-auto p-4">
            {results.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                Aucun r&eacute;sultat trouv&eacute;
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selected.size === results.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                    Tout s&eacute;lectionner ({selected.size}/{results.length})
                  </label>
                </div>
                <div className="space-y-2">
                  {results.map((person, i) => (
                    <label
                      key={person.id || i}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleOne(i)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {person.title}
                          {person.organization
                            ? ` @ ${person.organization.name}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {person.email || "Pas d'email"}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {searchDone && results.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              {importing
                ? "Import en cours..."
                : `Importer ${selected.size} contact(s)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
