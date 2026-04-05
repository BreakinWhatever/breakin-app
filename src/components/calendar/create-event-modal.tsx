"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  companyId: string;
  company?: { id: string; name: string } | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface EventFormData {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: string;
  contactId: string;
  companyId: string;
  location: string;
  notes: string;
}

interface CreateEventModalProps {
  onClose: () => void;
  onSave: (data: EventFormData) => void;
  initialDate?: string | null;
  editingEvent?: EventFormData | null;
}

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CreateEventModal({
  onClose,
  onSave,
  initialDate,
  editingEvent,
}: CreateEventModalProps) {
  const isEditing = !!editingEvent?.id;

  const getDefaultStart = useCallback(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      d.setHours(10, 0, 0, 0);
      return toLocalDateTimeString(d);
    }
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return toLocalDateTimeString(d);
  }, [initialDate]);

  const getDefaultEnd = useCallback(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      d.setHours(11, 0, 0, 0);
      return toLocalDateTimeString(d);
    }
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return toLocalDateTimeString(d);
  }, [initialDate]);

  const [form, setForm] = useState<EventFormData>(
    editingEvent ?? {
      title: "",
      description: "",
      startDate: getDefaultStart(),
      endDate: getDefaultEnd(),
      type: "interview",
      contactId: "",
      companyId: "",
      location: "",
      notes: "",
    }
  );

  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/companies").then((r) => r.json()),
    ]).then(([contactsData, companiesData]) => {
      setContacts(contactsData);
      setCompanies(companiesData);
    });
  }, []);

  // Auto-fill company when contact is selected
  useEffect(() => {
    if (form.contactId) {
      const contact = contacts.find((c) => c.id === form.contactId);
      if (contact?.companyId && !form.companyId) {
        setForm((prev) => ({ ...prev, companyId: contact.companyId }));
      }
    }
  }, [form.contactId, form.companyId, contacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return;
    setLoading(true);
    onSave(form);
  };

  const updateField = (field: keyof EventFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'evenement" : "Nouvel evenement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="evt-title">Titre *</Label>
            <Input
              id="evt-title"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Entretien chez Goldman Sachs"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => updateField("type", v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview">Entretien</SelectItem>
                <SelectItem value="followup">Relance</SelectItem>
                <SelectItem value="reminder">Rappel</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="evt-start">Debut *</Label>
              <Input
                id="evt-start"
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evt-end">Fin *</Label>
              <Input
                id="evt-end"
                type="datetime-local"
                required
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label>Contact</Label>
            <Select
              value={form.contactId || "none"}
              onValueChange={(v) => updateField("contactId", v === "none" ? "" : v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                    {c.company ? ` (${c.company.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label>Entreprise</Label>
            <Select
              value={form.companyId || "none"}
              onValueChange={(v) => updateField("companyId", v === "none" ? "" : v as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="evt-location">Lieu</Label>
            <Input
              id="evt-location"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="85 Avenue Foch, Paris / Zoom / Teams"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="evt-desc">Description</Label>
            <Textarea
              id="evt-desc"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              placeholder="Details de l'evenement..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="evt-notes">Notes</Label>
            <Textarea
              id="evt-notes"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              placeholder="Notes personnelles..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : isEditing ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
