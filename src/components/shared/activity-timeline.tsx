"use client";

import { useState } from "react";
import {
  Send,
  MailOpen,
  MessageSquare,
  CalendarPlus,
  StickyNote,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type TimelineEventType =
  | "email_sent"
  | "email_opened"
  | "reply_received"
  | "event_created"
  | "note";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: Date;
}

const eventConfig: Record<
  TimelineEventType,
  { icon: LucideIcon; color: string }
> = {
  email_sent: {
    icon: Send,
    color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40",
  },
  email_opened: {
    icon: MailOpen,
    color:
      "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40",
  },
  reply_received: {
    icon: MessageSquare,
    color:
      "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/40",
  },
  event_created: {
    icon: CalendarPlus,
    color:
      "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/40",
  },
  note: {
    icon: StickyNote,
    color: "text-muted-foreground bg-muted",
  },
};

function TimelineItem({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false);
  const config = eventConfig[event.type];
  const Icon = config.icon;

  return (
    <div className="relative flex gap-3 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border last:hidden" />

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
          config.color
        )}
      >
        <Icon className="size-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{event.title}</p>
          <time className="shrink-0 text-xs text-muted-foreground">
            {formatDistanceToNow(event.date, { addSuffix: true, locale: fr })}
          </time>
        </div>
        {event.description && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  expanded && "rotate-180"
                )}
              />
              {expanded ? "Masquer" : "Voir plus"}
            </button>
            {expanded && (
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Aucune activite
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </div>
  );
}
