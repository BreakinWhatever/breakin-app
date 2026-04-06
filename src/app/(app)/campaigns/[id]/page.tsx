"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MetricsCard } from "@/components/shared/metrics-card";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Email {
  id: string;
  type: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
}

interface Outreach {
  id: string;
  status: string;
  lastContactDate: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    priority: number;
    company: {
      id: string;
      name: string;
    };
  };
  emails: Email[];
}

interface CampaignDetail {
  id: string;
  name: string;
  targetRole: string;
  targetCity: string;
  status: string;
  createdAt: string;
  template: {
    name: string;
  } | null;
  outreaches: Outreach[];
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Brouillon", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "En pause", variant: "outline" },
};

const outreachStatusLabels: Record<string, string> = {
  identified: "Identifie",
  contacted: "Contacte",
  followup_1: "Relance 1",
  followup_2: "Relance 2",
  followup_3: "Relance 3",
  followed_up: "Relance",
  replied: "Repondu",
  interview: "Entretien",
  entretien: "Entretien",
  offer: "Offre",
  offre: "Offre",
};

const outreachStatusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  identified: "secondary",
  contacted: "outline",
  followup_1: "outline",
  followup_2: "outline",
  followup_3: "outline",
  followed_up: "outline",
  replied: "default",
  interview: "default",
  entretien: "default",
  offer: "default",
  offre: "default",
};

const pipelineBarColors: Record<string, string> = {
  identified: "bg-muted-foreground",
  contacted: "bg-blue-500",
  followup_1: "bg-amber-400",
  followup_2: "bg-amber-500",
  followup_3: "bg-orange-500",
  followed_up: "bg-amber-500",
  replied: "bg-emerald-500",
  interview: "bg-violet-500",
  entretien: "bg-violet-500",
  offer: "bg-emerald-600",
  offre: "bg-emerald-600",
};

const outreachColumns: ColumnDef<Outreach, unknown>[] = [
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }) => (
      <Link
        href={`/contacts/${row.original.contact.id}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        {row.original.contact.firstName} {row.original.contact.lastName}
      </Link>
    ),
    enableSorting: true,
    accessorFn: (row) => `${row.contact.firstName} ${row.contact.lastName}`,
  },
  {
    id: "company",
    header: "Entreprise",
    cell: ({ row }) => (
      <Link
        href={`/companies/${row.original.contact.company.id}`}
        className="text-sm text-primary hover:underline"
      >
        {row.original.contact.company.name}
      </Link>
    ),
    enableSorting: true,
    accessorFn: (row) => row.contact.company.name,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={outreachStatusVariants[row.original.status] ?? "secondary"}>
        {outreachStatusLabels[row.original.status] || row.original.status}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    id: "priority",
    header: "Priorite",
    cell: ({ row }) => (
      <Badge variant="outline">P{row.original.contact.priority}</Badge>
    ),
    enableSorting: true,
    accessorFn: (row) => row.contact.priority,
  },
  {
    id: "emails",
    header: "Emails",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.emails.length}</span>
    ),
    enableSorting: true,
    accessorFn: (row) => row.emails.length,
  },
  {
    id: "lastContact",
    header: "Dernier contact",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.lastContactDate
          ? new Date(row.original.lastContactDate).toLocaleDateString("fr-FR")
          : "-"}
      </span>
    ),
    enableSorting: true,
    accessorFn: (row) => row.lastContactDate ?? "",
  },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/campaigns/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setCampaign(null);
        } else {
          setCampaign(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const stats = useMemo(() => {
    if (!campaign) return null;
    const totalContacts = campaign.outreaches.length;
    const allEmails = campaign.outreaches.flatMap((o) => o.emails);
    const sentEmails = allEmails.filter((e) => e.status === "sent");
    const emailsSent = sentEmails.length;
    const openedEmails = sentEmails.filter((e) => e.openedAt);
    const openRate =
      emailsSent > 0 ? Math.round((openedEmails.length / emailsSent) * 100) : 0;
    const repliedEmails = sentEmails.filter((e) => e.repliedAt);
    const replyRate =
      emailsSent > 0 ? Math.round((repliedEmails.length / emailsSent) * 100) : 0;
    return { totalContacts, emailsSent, openRate, replyRate, openedEmails, repliedEmails };
  }, [campaign]);

  const pipelineData = useMemo(() => {
    if (!campaign) return [];
    const pipelineStatuses = [
      "identified", "contacted", "followup_1", "followup_2",
      "followup_3", "replied", "interview", "offer",
    ];
    return pipelineStatuses.map((s) => ({
      key: s,
      label: outreachStatusLabels[s] || s,
      count: campaign.outreaches.filter((o) => o.status === s).length,
      color: pipelineBarColors[s] || "bg-muted-foreground",
    }));
  }, [campaign]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Campagne introuvable</p>
        <Link href="/campaigns">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4 mr-1" />
            Retour aux campagnes
          </Button>
        </Link>
      </div>
    );
  }

  const config = statusConfig[campaign.status] || statusConfig.draft;
  const totalForBar = pipelineData.reduce((acc, p) => acc + p.count, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-3.5 mr-1" />
            Campagnes
          </Button>
        </Link>
      </div>

      <PageHeader
        title={campaign.name}
        description={`${campaign.targetRole} \u00b7 ${campaign.targetCity}`}
        actions={<Badge variant={config.variant}>{config.label}</Badge>}
      />

      {/* Matching criteria banner */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Criteres
          </span>
          <span className="text-sm font-medium">
            Role : {campaign.targetRole}
          </span>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm font-medium">
            Ville : {campaign.targetCity}
          </span>
          {campaign.template && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                Template : {campaign.template.name}
              </span>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricsCard label="Contacts" value={stats?.totalContacts ?? 0} />
        <MetricsCard label="Emails envoyes" value={stats?.emailsSent ?? 0} />
        <MetricsCard
          label="Taux d'ouverture"
          value={`${stats?.openRate ?? 0}%`}
        />
        <MetricsCard
          label="Taux de reponse"
          value={`${stats?.replyRate ?? 0}%`}
        />
      </div>

      {/* Pipeline mini-view */}
      <Card>
        <CardContent>
          <h2 className="text-sm font-semibold mb-3">Pipeline</h2>
          {totalForBar > 0 ? (
            <>
              <div className="flex rounded-lg overflow-hidden h-6">
                {pipelineData
                  .filter((p) => p.count > 0)
                  .map((p) => (
                    <div
                      key={p.key}
                      className={cn(
                        p.color,
                        "flex items-center justify-center text-xs font-medium text-white"
                      )}
                      style={{
                        width: `${(p.count / totalForBar) * 100}%`,
                        minWidth: "2rem",
                      }}
                    >
                      {p.count}
                    </div>
                  ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {pipelineData.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full", p.color)} />
                    <span>
                      {p.label} ({p.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun outreach</p>
          )}
        </CardContent>
      </Card>

      {/* Outreaches table */}
      <div>
        <h2 className="text-base font-semibold mb-3">
          Outreaches ({campaign.outreaches.length})
        </h2>
        <DataTable
          columns={outreachColumns}
          data={campaign.outreaches}
          emptyState={{
            icon: Users,
            title: "Aucun outreach",
            description: "Aucun outreach dans cette campagne.",
          }}
        />
      </div>
    </div>
  );
}
