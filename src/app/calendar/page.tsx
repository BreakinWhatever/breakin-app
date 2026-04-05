"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type {
  EventClickArg,
  DateSelectArg,
  EventDropArg,
  DatesSetArg,
} from "@fullcalendar/core";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    title: string;
  } | null;
  company?: {
    id: string;
    name: string;
    sector: string;
    city: string;
  } | null;
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
  const [createInitialDate, setCreateInitialDate] = useState<string | null>(
    null
  );
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

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const apiEvent = events.find((e) => e.id === info.event.id);
      if (apiEvent) setSelectedEvent(apiEvent);
    },
    [events]
  );

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
          toast.success("Evenement modifie");
        } else {
          await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          toast.success("Evenement cree");
        }

        setShowCreateModal(false);
        setEditingEvent(null);
        refetchCurrent();
      } catch (err) {
        console.error("Failed to save event:", err);
        toast.error("Erreur lors de la sauvegarde");
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
        toast.error("Erreur lors de la suppression");
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

  const feedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/calendar/feed`
      : "";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true);
      toast.success("Lien copie !");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [feedUrl]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendrier"
        description="Entretiens, relances et rappels"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(true)}
            >
              <RefreshCw className="size-4 mr-1" />
              Sync
            </Button>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setCreateInitialDate(null);
                setShowCreateModal(true);
              }}
            >
              <Plus className="size-4 mr-1" />
              Nouvel evenement
            </Button>
          </div>
        }
      />

      {/* Calendar */}
      <Card>
        <CardContent>
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
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
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-600" />
          Entretien
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Relance
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          Rappel
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-muted-foreground" />
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
      <Dialog
        open={showSyncDialog}
        onOpenChange={(isOpen) => !isOpen && setShowSyncDialog(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Synchroniser avec Apple Calendar</DialogTitle>
            <DialogDescription>
              Copiez ce lien et ajoutez-le dans Apple Calendar (Fichier &gt;
              Nouvel abonnement a un calendrier)
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={feedUrl}
              className="flex-1"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={handleCopy} variant="outline">
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Le calendrier se mettra a jour automatiquement dans Apple Calendar.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
