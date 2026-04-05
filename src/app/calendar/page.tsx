"use client";

import { useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DateSelectArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import EventModal from "@/components/calendar/event-modal";
import CreateEventModal from "@/components/calendar/create-event-modal";

interface ApiEvent {
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

const TYPE_COLORS: Record<string, string> = {
  interview: "#9333ea",
  followup: "#2563eb",
  reminder: "#eab308",
  other: "#6b7280",
};

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventFormData | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentRangeRef = useRef<{ from: string; to: string } | null>(null);

  const fetchEvents = useCallback(async (from: string, to: string) => {
    try {
      const res = await fetch(`/api/events?from=${from}&to=${to}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  }, []);

  const refetchCurrent = useCallback(() => {
    if (currentRangeRef.current) {
      fetchEvents(currentRangeRef.current.from, currentRangeRef.current.to);
    }
  }, [fetchEvents]);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      const from = arg.startStr;
      const to = arg.endStr;
      currentRangeRef.current = { from, to };
      fetchEvents(from, to);
    },
    [fetchEvents]
  );

  const handleEventClick = useCallback((info: EventClickArg) => {
    const apiEvent = events.find((e) => e.id === info.event.id);
    if (apiEvent) setSelectedEvent(apiEvent);
  }, [events]);

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    setCreateInitialDate(info.startStr);
    setEditingEvent(null);
    setShowCreateModal(true);
  }, []);

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const { event } = info;
      try {
        await fetch(`/api/events/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: event.start?.toISOString(),
            endDate: (event.end ?? event.start)?.toISOString(),
          }),
        });
        refetchCurrent();
      } catch (err) {
        console.error("Failed to move event:", err);
        info.revert();
      }
    },
    [refetchCurrent]
  );

  const handleCreateSave = useCallback(
    async (data: EventFormData) => {
      try {
        const payload = {
          title: data.title,
          description: data.description || null,
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
          type: data.type,
          contactId: data.contactId || null,
          companyId: data.companyId || null,
          location: data.location || null,
          notes: data.notes || null,
        };

        if (data.id) {
          await fetch(`/api/events/${data.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        setShowCreateModal(false);
        setEditingEvent(null);
        refetchCurrent();
      } catch (err) {
        console.error("Failed to save event:", err);
      }
    },
    [refetchCurrent]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/events/${id}`, { method: "DELETE" });
        setSelectedEvent(null);
        refetchCurrent();
      } catch (err) {
        console.error("Failed to delete event:", err);
      }
    },
    [refetchCurrent]
  );

  const handleEdit = useCallback((event: ApiEvent) => {
    setSelectedEvent(null);
    setEditingEvent({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      startDate: toLocalDateTimeString(new Date(event.startDate)),
      endDate: toLocalDateTimeString(new Date(event.endDate)),
      type: event.type,
      contactId: event.contactId ?? "",
      companyId: event.companyId ?? "",
      location: event.location ?? "",
      notes: event.notes ?? "",
    });
    setShowCreateModal(true);
  }, []);

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: e.endDate,
    backgroundColor: e.color ?? TYPE_COLORS[e.type] ?? TYPE_COLORS.other,
    borderColor: e.color ?? TYPE_COLORS[e.type] ?? TYPE_COLORS.other,
    textColor: e.type === "reminder" ? "#1f2937" : "#ffffff",
  }));

  const feedUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/calendar/feed`
    : "";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [feedUrl]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="text-sm text-gray-500 mt-1">
            Entretiens, relances et rappels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSyncDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
          </button>
          <button
            onClick={() => {
              setEditingEvent(null);
              setCreateInitialDate(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nouvel evenement
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          locale="fr"
          firstDay={1}
          selectable
          editable
          events={calendarEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          height="auto"
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            list: "Liste",
          }}
          eventDisplay="block"
          dayMaxEvents={3}
          nowIndicator
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-600" />
          Entretien
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600" />
          Relance
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          Rappel
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-500" />
          Autre
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
          onSave={handleCreateSave}
          initialDate={createInitialDate}
          editingEvent={editingEvent}
        />
      )}

      {/* Sync Dialog */}
      {showSyncDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Synchroniser avec Apple Calendar
              </h2>
              <button
                onClick={() => setShowSyncDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Copiez ce lien et ajoutez-le dans Apple Calendar
                (Fichier &gt; Nouvel abonnement a un calendrier)
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={feedUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 select-all outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {copied ? "Copie !" : "Copier"}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Le calendrier se mettra a jour automatiquement dans Apple Calendar.
              </p>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-100">
              <button
                onClick={() => setShowSyncDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
