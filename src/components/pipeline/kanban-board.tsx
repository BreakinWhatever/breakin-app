"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Kanban } from "lucide-react";
import KanbanCard from "./kanban-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { SidePanel } from "@/components/shared/side-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ActivityTimeline,
  type TimelineEvent,
} from "@/components/shared/activity-timeline";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// --- Types ---

interface OutreachData {
  id: string;
  status: string;
  lastContactDate: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string | null;
    linkedinUrl: string | null;
    priority: number;
    source: string;
    company: {
      id: string;
      name: string;
      website: string | null;
    };
  };
  emails?: {
    id: string;
    type: string;
    subject: string;
    body: string;
    status: string;
    sentAt: string | null;
    createdAt: string;
  }[];
}

interface Campaign {
  id: string;
  name: string;
}

interface ColumnDef {
  key: string;
  label: string;
  color: string;
}

// --- Column config ---

const COLUMN_COLORS: Record<string, string> = {
  contacted: "bg-blue-500",
  followup_1: "bg-yellow-400",
  followup_2: "bg-yellow-500",
  followup_3: "bg-orange-500",
  replied: "bg-green-500",
  interview: "bg-purple-500",
  offer: "bg-emerald-500",
};

const BASE_COLUMNS: ColumnDef[] = [
  { key: "contacted", label: "Contacte", color: COLUMN_COLORS.contacted },
  { key: "followup_1", label: "Relance 1", color: COLUMN_COLORS.followup_1 },
  { key: "followup_2", label: "Relance 2", color: COLUMN_COLORS.followup_2 },
  { key: "followup_3", label: "Relance 3", color: COLUMN_COLORS.followup_3 },
  { key: "replied", label: "Repondu", color: COLUMN_COLORS.replied },
  { key: "interview", label: "Entretien", color: COLUMN_COLORS.interview },
  { key: "offer", label: "Offre", color: COLUMN_COLORS.offer },
];

// --- Build timeline from outreach emails ---

function buildTimeline(outreach: OutreachData): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  if (outreach.emails) {
    for (const email of outreach.emails) {
      events.push({
        id: email.id,
        type: email.status === "sent" ? "email_sent" : "email_sent",
        title:
          email.type === "initial"
            ? "Email initial envoye"
            : "Relance envoyee",
        description: `${email.subject}`,
        date: new Date(email.sentAt || email.createdAt),
      });
    }
  }
  if (outreach.status === "replied") {
    events.push({
      id: `reply-${outreach.id}`,
      type: "reply_received",
      title: "Reponse recue",
      date: new Date(outreach.lastContactDate || new Date().toISOString()),
    });
  }
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events;
}

// --- Main component ---

interface KanbanBoardProps {
  campaignFilter?: string;
  onCampaignFilterChange?: (value: string) => void;
}

export default function KanbanBoard({
  campaignFilter,
  onCampaignFilterChange,
}: KanbanBoardProps) {
  const [outreaches, setOutreaches] = useState<OutreachData[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState(
    campaignFilter ?? ""
  );
  const [loading, setLoading] = useState(true);
  const [followUpSpacing, setFollowUpSpacing] = useState<number[]>([3, 7, 14]);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Side panel
  const [selectedOutreach, setSelectedOutreach] =
    useState<OutreachData | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Fetch campaigns
  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
      });
  }, []);

  // Fetch follow-up spacing from settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.followUpSpacing) {
          try {
            const parsed = JSON.parse(data.followUpSpacing);
            if (Array.isArray(parsed)) {
              setFollowUpSpacing(parsed);
            }
          } catch {
            const parts = data.followUpSpacing
              .split(",")
              .map((s: string) => parseInt(s.trim(), 10))
              .filter((n: number) => !isNaN(n));
            if (parts.length > 0) {
              setFollowUpSpacing(parts);
            }
          }
        }
      })
      .catch(() => {
        // Keep defaults
      });
  }, []);

  // Build columns with dynamic relance day labels
  const columns = useMemo(() => {
    return BASE_COLUMNS.map((col) => {
      if (col.key === "followup_1" && followUpSpacing[0] !== undefined) {
        return { ...col, label: `Relance 1 (J+${followUpSpacing[0]})` };
      }
      if (col.key === "followup_2" && followUpSpacing[1] !== undefined) {
        return { ...col, label: `Relance 2 (J+${followUpSpacing[1]})` };
      }
      if (col.key === "followup_3" && followUpSpacing[2] !== undefined) {
        return { ...col, label: `Relance 3 (J+${followUpSpacing[2]})` };
      }
      return col;
    });
  }, [followUpSpacing]);

  // Fetch outreaches
  const fetchOutreaches = useCallback(() => {
    const params = selectedCampaign
      ? `?campaignId=${encodeURIComponent(selectedCampaign)}`
      : "";
    fetch(`/api/outreaches${params}`)
      .then((r) => r.json())
      .then((data) => {
        const contacted = (Array.isArray(data) ? data : []).filter(
          (o: OutreachData) => o.status !== "identified"
        );
        setOutreaches(contacted);
      })
      .finally(() => setLoading(false));
  }, [selectedCampaign]);

  useEffect(() => {
    setLoading(true);
    fetchOutreaches();
  }, [fetchOutreaches]);

  // Campaign filter
  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
    onCampaignFilterChange?.(value);
  };

  // Drag and drop
  function handleDragOver(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    setDragOverColumn(null);
    const outreachId = e.dataTransfer.getData("text/plain");
    if (!outreachId) return;

    // Optimistic update
    setOutreaches((prev) =>
      prev.map((o) =>
        o.id === outreachId
          ? {
              ...o,
              status: newStatus,
              lastContactDate: new Date().toISOString(),
            }
          : o
      )
    );

    try {
      const res = await fetch(`/api/outreaches/${outreachId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          lastContactDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      fetchOutreaches();
    }
  }

  // Card click -> side panel
  const handleCardClick = (outreach: OutreachData) => {
    setSelectedOutreach(outreach);
    setPanelOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.key}
            className="shrink-0 w-56 space-y-2"
          >
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (outreaches.length === 0) {
    return (
      <EmptyState
        icon={Kanban}
        title="Pipeline vide"
        description="Contactez vos premiers leads pour les voir apparaitre dans le pipeline."
      />
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = outreaches.filter((o) => o.status === col.key);
          const isOver = dragOverColumn === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={cn(
                "shrink-0 w-56 rounded-xl p-3 transition-colors",
                "bg-muted/50",
                isOver && "bg-muted ring-2 ring-primary/20"
              )}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn("size-2.5 rounded-full shrink-0", col.color)}
                />
                <h3 className="text-sm font-semibold truncate">{col.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {items.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[200px]">
                <AnimatePresence mode="popLayout">
                  {items.map((o) => (
                    <KanbanCard
                      key={o.id}
                      id={o.id}
                      contactName={`${o.contact.firstName} ${o.contact.lastName}`}
                      companyName={o.contact.company.name}
                      companyWebsite={o.contact.company.website}
                      priority={o.contact.priority}
                      lastContactDate={o.lastContactDate}
                      onClick={() => handleCardClick(o)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side panel for selected outreach */}
      {selectedOutreach && (
        <SidePanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          title={`${selectedOutreach.contact.firstName} ${selectedOutreach.contact.lastName}`}
          subtitle={`${selectedOutreach.contact.title} @ ${selectedOutreach.contact.company.name}`}
        >
          <Tabs defaultValue="infos">
            <TabsList variant="line" className="w-full mb-4">
              <TabsTrigger value="infos">Infos</TabsTrigger>
              <TabsTrigger value="activite">Activite</TabsTrigger>
            </TabsList>

            <TabsContent value="infos">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedOutreach.contact.email}</p>
                </div>
                {selectedOutreach.contact.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Telephone</p>
                    <p className="text-sm">{selectedOutreach.contact.phone}</p>
                  </div>
                )}
                {selectedOutreach.contact.linkedinUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground">LinkedIn</p>
                    <a
                      href={selectedOutreach.contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedOutreach.contact.linkedinUrl.replace(
                        /^https?:\/\/(www\.)?linkedin\.com\//,
                        ""
                      )}
                    </a>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Entreprise</p>
                  <p className="text-sm">
                    {selectedOutreach.contact.company.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedOutreach.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {selectedOutreach.contact.source}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activite">
              <ActivityTimeline events={buildTimeline(selectedOutreach)} />
            </TabsContent>
          </Tabs>
        </SidePanel>
      )}
    </>
  );
}
