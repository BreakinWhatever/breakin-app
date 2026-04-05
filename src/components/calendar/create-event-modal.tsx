"use client";

import { useState, useEffect, useCallback } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Modifier l'evenement" : "Nouvel evenement"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Entretien chez Goldman Sachs"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="interview">Entretien</option>
              <option value="followup">Relance</option>
              <option value="reminder">Rappel</option>
              <option value="other">Autre</option>
            </select>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debut *</label>
              <input
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input
                type="datetime-local"
                required
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <select
              value={form.contactId}
              onChange={(e) => updateField("contactId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">— Aucun —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.company ? ` (${c.company.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
            <select
              value={form.companyId}
              onChange={(e) => updateField("companyId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="">— Aucune —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="85 Avenue Foch, Paris / Zoom / Teams"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              placeholder="Details de l'evenement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
              placeholder="Notes personnelles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : isEditing ? "Enregistrer" : "Creer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
