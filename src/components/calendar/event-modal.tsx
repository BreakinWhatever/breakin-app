"use client";

import { useCallback } from "react";
import {
  Calendar,
  MapPin,
  User,
  Building2,
  AlignLeft,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default function EventModal({
  event,
  onClose,
  onDelete,
  onEdit,
}: EventModalProps) {
  const handleDelete = useCallback(() => {
    if (event) {
      onDelete(event.id);
      toast.success("Evenement supprime");
    }
  }, [event, onDelete]);

  if (!event) return null;

  return (
    <Dialog open={!!event} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">
              {typeLabels[event.type] ?? event.type}
            </Badge>
          </div>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="size-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                {formatDate(event.startDate)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatTime(event.startDate)} — {formatTime(event.endDate)}
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-muted-foreground mt-0.5" />
              <p className="text-sm">{event.location}</p>
            </div>
          )}

          {/* Contact */}
          {event.contact && (
            <div className="flex items-start gap-3">
              <User className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {event.contact.firstName} {event.contact.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.contact.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {event.contact.email}
                </p>
              </div>
            </div>
          )}

          {/* Company */}
          {event.company && (
            <div className="flex items-start gap-3">
              <Building2 className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{event.company.name}</p>
                <p className="text-sm text-muted-foreground">
                  {event.company.sector} — {event.company.city}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <AlignLeft className="size-4 text-muted-foreground mt-0.5" />
              <p className="text-sm">{event.description}</p>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="flex items-start gap-3">
              <StickyNote className="size-4 text-muted-foreground mt-0.5" />
              <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Supprimer
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          <Button size="sm" onClick={() => onEdit(event)}>
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
