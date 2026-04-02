"use client";

import { useEffect, useState } from "react";

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
}

interface MetricsBarProps {
  campaignId?: string;
}

export default function MetricsBar({ campaignId }: MetricsBarProps) {
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

  const sentEmails = emails.filter((e) => e.status === "sent");
  const today = new Date().toDateString();
  const sentToday = sentEmails.filter(
    (e) => e.sentAt && new Date(e.sentAt).toDateString() === today
  ).length;

  const openedEmails = sentEmails.filter((e) => e.openedAt);
  const openRate =
    sentEmails.length > 0
      ? Math.round((openedEmails.length / sentEmails.length) * 100)
      : 0;

  const repliedEmails = sentEmails.filter((e) => e.repliedAt);
  const replyRate =
    sentEmails.length > 0
      ? Math.round((repliedEmails.length / sentEmails.length) * 100)
      : 0;

  const interviews = outreaches.filter(
    (o) => o.status === "entretien" || o.status === "interview"
  ).length;

  const metrics = [
    {
      label: "Emails envoy\u00e9s",
      value: loading ? "..." : `${sentEmails.length}`,
      sub: `${sentToday} aujourd'hui`,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Taux d'ouverture",
      value: loading ? "..." : `${openRate}%`,
      sub: `${openedEmails.length}/${sentEmails.length} ouverts`,
      color: "text-green-600",
      bg: "bg-green-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: "Taux de r\u00e9ponse",
      value: loading ? "..." : `${replyRate}%`,
      sub: `${repliedEmails.length}/${sentEmails.length} r\u00e9ponses`,
      color: "text-purple-600",
      bg: "bg-purple-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    },
    {
      label: "Entretiens",
      value: loading ? "..." : `${interviews}`,
      sub: "entretiens obtenus",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{m.label}</p>
              <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
            </div>
            <div className={`${m.bg} ${m.color} p-3 rounded-lg`}>{m.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
