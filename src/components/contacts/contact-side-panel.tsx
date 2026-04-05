"use client";

import { SidePanel } from "@/components/shared/side-panel";
import {
  ActivityTimeline,
  type TimelineEvent,
} from "@/components/shared/activity-timeline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  Link2,
  Globe,
  Building2,
  Send,
  MailOpen,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { type ContactRow } from "./contacts-table";

// --- Priority badge config ---

const priorityConfig: Record<
  number,
  {
    label: string;
    variant: "destructive" | "default" | "secondary" | "outline";
    className?: string;
  }
> = {
  1: { label: "P1", variant: "destructive" },
  2: {
    label: "P2",
    variant: "default",
    className:
      "bg-orange-500/10 text-orange-600 border-transparent dark:text-orange-400",
  },
  3: {
    label: "P3",
    variant: "default",
    className:
      "bg-blue-500/10 text-blue-600 border-transparent dark:text-blue-400",
  },
  4: { label: "P4", variant: "secondary" },
  5: { label: "P5", variant: "secondary" },
};

// --- Info row ---

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  href?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            {value}
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <p className="text-sm">{value}</p>
        )}
      </div>
    </div>
  );
}

// --- Email item ---

interface EmailItem {
  id: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

function EmailCard({ email }: { email: EmailItem }) {
  const isSent = email.status === "sent" || email.status === "approved";
  const date = email.sentAt || email.createdAt;

  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isSent ? (
            <Send className="size-3.5 text-blue-500 shrink-0" />
          ) : (
            <MailOpen className="size-3.5 text-emerald-500 shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{email.subject}</span>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {email.type === "initial" ? "Initial" : "Relance"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {email.body}
      </p>
      <div className="flex items-center justify-between">
        <Badge
          variant={
            email.status === "sent"
              ? "default"
              : email.status === "draft"
                ? "secondary"
                : "outline"
          }
          className="text-xs"
        >
          {email.status}
        </Badge>
        <time className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>
    </div>
  );
}

// --- Inbound email type ---

interface InboundEmailItem {
  id: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string;
}

// --- Build timeline events from outreaches + inbound emails ---

function buildTimelineEvents(contact: ContactRow & { inboundEmails?: InboundEmailItem[] }): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (contact.outreaches) {
    for (const outreach of contact.outreaches) {
      if (outreach.emails) {
        for (const email of outreach.emails) {
          events.push({
            id: email.id,
            type: email.status === "sent" ? "email_sent" : "email_sent",
            title:
              email.type === "initial"
                ? "Email initial envoye"
                : "Relance envoyee",
            description: `${email.subject} - ${email.body.substring(0, 100)}...`,
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
    }
  }

  // Add inbound emails to timeline
  if (contact.inboundEmails) {
    for (const inbound of contact.inboundEmails) {
      events.push({
        id: `inbound-${inbound.id}`,
        type: "reply_content",
        title: `Reponse: ${inbound.subject}`,
        description: inbound.bodyText
          ? inbound.bodyText.substring(0, 150) + (inbound.bodyText.length > 150 ? "..." : "")
          : undefined,
        date: new Date(inbound.receivedAt),
      });
    }
  }

  // Sort by date descending (most recent first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events;
}

// --- Inbound email card ---

function InboundEmailCard({ email }: { email: InboundEmailItem }) {
  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="size-3.5 text-green-500 shrink-0" />
          <span className="text-sm font-medium truncate">{email.subject}</span>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          Recu
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        De: {email.fromName || email.fromEmail}
      </p>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {email.bodyText || "(contenu HTML uniquement)"}
      </p>
      <div className="flex items-center justify-end">
        <time className="text-xs text-muted-foreground">
          {new Date(email.receivedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>
    </div>
  );
}

// --- Collect all emails from outreaches ---

function collectEmails(contact: ContactRow): EmailItem[] {
  const emails: EmailItem[] = [];
  if (contact.outreaches) {
    for (const outreach of contact.outreaches) {
      if (outreach.emails) {
        emails.push(...outreach.emails);
      }
    }
  }
  // Sort by date descending
  emails.sort(
    (a, b) =>
      new Date(b.sentAt || b.createdAt).getTime() -
      new Date(a.sentAt || a.createdAt).getTime()
  );
  return emails;
}

// --- Main component ---

interface ContactSidePanelProps {
  contact: (ContactRow & { inboundEmails?: InboundEmailItem[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function ContactSidePanel({
  contact,
  open,
  onOpenChange,
  onPrev,
  onNext,
}: ContactSidePanelProps) {
  if (!contact) return null;

  const pConfig = priorityConfig[contact.priority] || priorityConfig[4];
  const timelineEvents = buildTimelineEvents(contact);
  const allEmails = collectEmails(contact);
  const inboundEmails: InboundEmailItem[] = contact.inboundEmails || [];

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={`${contact.firstName} ${contact.lastName}`}
      subtitle={`${contact.title} @ ${contact.company.name}`}
      badge={{ label: pConfig.label, variant: pConfig.variant === "destructive" ? "destructive" : "secondary" }}
      onPrev={onPrev}
      onNext={onNext}
    >
      <Tabs defaultValue="infos">
        <TabsList variant="line" className="w-full mb-4">
          <TabsTrigger value="infos">Infos</TabsTrigger>
          <TabsTrigger value="activite">Activite</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>

        {/* --- Infos tab --- */}
        <TabsContent value="infos">
          <div className="space-y-1">
            <InfoRow
              icon={Mail}
              label="Email"
              value={contact.email}
              href={`mailto:${contact.email}`}
            />
            <InfoRow
              icon={Phone}
              label="Telephone"
              value={contact.phone}
              href={contact.phone ? `tel:${contact.phone}` : undefined}
            />
            <InfoRow
              icon={Link2}
              label="LinkedIn"
              value={
                contact.linkedinUrl
                  ? contact.linkedinUrl.replace(
                      /^https?:\/\/(www\.)?linkedin\.com\//,
                      ""
                    )
                  : null
              }
              href={contact.linkedinUrl || undefined}
            />
          </div>

          <Separator className="my-3" />

          <div className="space-y-1">
            <InfoRow
              icon={Building2}
              label="Entreprise"
              value={contact.company.name}
            />
            {contact.company.website && (
              <InfoRow
                icon={Globe}
                label="Site web"
                value={contact.company.website}
                href={
                  contact.company.website.startsWith("http")
                    ? contact.company.website
                    : `https://${contact.company.website}`
                }
              />
            )}
          </div>

          <Separator className="my-3" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Priorite</span>
              <Badge variant={pConfig.variant} className={pConfig.className}>
                {pConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Source</span>
              <Badge variant="outline" className="capitalize">
                {contact.source}
              </Badge>
            </div>
          </div>

          {contact.notes && (
            <>
              <Separator className="my-3" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            </>
          )}
        </TabsContent>

        {/* --- Activite tab --- */}
        <TabsContent value="activite">
          <ActivityTimeline events={timelineEvents} />
        </TabsContent>

        {/* --- Emails tab --- */}
        <TabsContent value="emails">
          <div className="space-y-4">
            {/* Emails recus */}
            {inboundEmails.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Emails recus
                </h4>
                <div className="space-y-3">
                  {inboundEmails.map((email) => (
                    <InboundEmailCard key={email.id} email={email} />
                  ))}
                </div>
              </div>
            )}

            {/* Emails envoyes */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Emails envoyes
              </h4>
              {allEmails.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Aucun email envoye
                </p>
              ) : (
                <div className="space-y-3">
                  {allEmails.map((email) => (
                    <EmailCard key={email.id} email={email} />
                  ))}
                </div>
              )}
            </div>

            {allEmails.length === 0 && inboundEmails.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun email
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </SidePanel>
  );
}
