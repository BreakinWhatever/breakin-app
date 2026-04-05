"use client";

import { useCallback } from "react";

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  type: string;
  contactId?: string | null;
  companyId?: string | null;
  outreachId?: string | null;
  location?: string | null;
  notes?: string | null;
  color?: string | null;
  contact?: { id: string; firstName: string; lastName: string; email: string; title: string } | null;
  company?: { id: string; name: string; sector: string; city: string } | null;
}

interface EventModalProps {
  event: EventData | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (event: EventData) => void;
}

const typeLabels: Record<string, string> = {
  interview: "Entretien",
  followup: "Relance",
  reminder: "Rappel",
  other: "Autre",
};

const typeColors: Record<string, string> = {
  interview: "bg-purple-100 text-purple-800",
  followup: "bg-blue-100 text-blue-800",
  reminder: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventModal({ event, onClose, onDelete, onEdit }: EventModalProps) {
  const handleDelete = useCallback(() => {
    if (event && confirm("Supprimer cet evenement ?")) {
      onDelete(event.id);
    }
  }, [event, onDelete]);

  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  typeColors[event.type] ?? typeColors.other
                }`}
              >
                {typeLabels[event.type] ?? event.type}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 truncate">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDate(event.startDate)}</p>
              <p className="text-sm text-gray-500">
                {formatTime(event.startDate)} — {formatTime(event.endDate)}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-700">{event.location}</p>
            </div>
          )}

          {/* Contact */}
          {event.contact && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {event.contact.firstName} {event.contact.lastName}
                </p>
                <p className="text-sm text-gray-500">{event.contact.title}</p>
                <p className="text-sm text-gray-500">{event.contact.email}</p>
              </div>
            </div>
          )}

          {/* Company */}
          {event.company && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{event.company.name}</p>
                <p className="text-sm text-gray-500">{event.company.sector} — {event.company.city}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p className="text-sm text-gray-700">{event.description}</p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            Supprimer
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => onEdit(event)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
