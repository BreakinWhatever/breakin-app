"use client";

import { useEffect, useState, useMemo } from "react";
import { MetricsCard } from "@/components/shared/metrics-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface Email {
  id: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
}

interface Outreach {
  id: string;
  status: string;
  lastContactDate: string | null;
}

interface MetricsBarProps {
  campaignId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card size="sm" key={i}>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MetricsBar({ campaignId, dateFrom, dateTo }: MetricsBarProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const emailParams = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";
    const outreachParams = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : "";

    Promise.all([
      fetch(`/api/emails${emailParams}`).then((r) => r.json()),
      fetch(`/api/outreaches${outreachParams}`).then((r) => r.json()),
    ])
      .then(([emailData, outreachData]) => {
        setEmails(Array.isArray(emailData) ? emailData : []);
        setOutreaches(Array.isArray(outreachData) ? outreachData : []);
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  // Filter by date range
  const filteredEmails = useMemo(() => {
    if (!dateFrom && !dateTo) return emails;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
    return emails.filter((e) => {
      if (!e.sentAt) return true;
      const sent = new Date(e.sentAt);
      if (from && sent < from) return false;
      if (to && sent > to) return false;
      return true;
    });
  }, [emails, dateFrom, dateTo]);

  const filteredOutreaches = useMemo(() => {
    if (!dateFrom && !dateTo) return outreaches;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;
    return outreaches.filter((o) => {
      if (!o.lastContactDate) return true;
      const d = new Date(o.lastContactDate);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [outreaches, dateFrom, dateTo]);

  const contacts = filteredOutreaches.length;

  const sentEmails = filteredEmails.filter((e) => e.status === "sent");

  const repliedEmails = sentEmails.filter((e) => e.repliedAt);
  const replyRate =
    sentEmails.length > 0
      ? Math.round((repliedEmails.length / sentEmails.length) * 100)
      : 0;

  const interviews = filteredOutreaches.filter(
    (o) => o.status === "entretien" || o.status === "interview"
  ).length;

  if (loading) {
    return <MetricsSkeleton />;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricsCard label="Contacts sources" value={contacts} />
      <MetricsCard label="Emails envoyes" value={sentEmails.length} />
      <MetricsCard label="Taux de reponse" value={`${replyRate}%`} />
      <MetricsCard label="Entretiens" value={interviews} />
    </div>
  );
}
