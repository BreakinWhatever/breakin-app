"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Loader2 } from "lucide-react";

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
        `Import termine : ${data.created} cree(s), ${data.skipped} ignore(s)`
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importer depuis Apollo</DialogTitle>
          <DialogDescription>
            Recherchez des contacts par titre, ville et secteur.
          </DialogDescription>
        </DialogHeader>

        {/* Search form */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="apollo-title" className="text-xs">
              Titre / Role
            </Label>
            <Input
              id="apollo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Analyst, Associate..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apollo-city" className="text-xs">
              Ville
            </Label>
            <Input
              id="apollo-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apollo-sector" className="text-xs">
              Secteur
            </Label>
            <Input
              id="apollo-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={searching}
          className="w-fit"
        >
          {searching ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Search className="size-4 mr-1.5" />
          )}
          {searching ? "Recherche..." : "Rechercher"}
        </Button>

        {/* Results */}
        {searchDone && (
          <div className="flex-1 overflow-y-auto -mx-4 px-4 min-h-0">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Aucun resultat trouve
              </p>
            ) : (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.size === results.length}
                    onChange={toggleAll}
                    className="size-4 rounded border-input accent-primary"
                  />
                  Tout selectionner ({selected.size}/{results.length})
                </label>
                <div className="space-y-1.5">
                  {results.map((person, i) => (
                    <label
                      key={person.id || i}
                      className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggleOne(i)}
                        className="size-4 rounded border-input accent-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {person.title}
                          {person.organization
                            ? ` @ ${person.organization.name}`
                            : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {person.email || "Pas d'email"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import footer */}
        {searchDone && results.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
            >
              {importing ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="size-4 mr-1.5" />
              )}
              {importing
                ? "Import en cours..."
                : `Importer ${selected.size} contact(s)`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
