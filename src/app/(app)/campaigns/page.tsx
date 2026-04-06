"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CampaignForm from "@/components/campaigns/campaign-form";

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
  campaignId: string;
  emails: Email[];
}

interface Campaign {
  id: string;
  name: string;
  targetRole: string;
  targetCity: string;
  status: string;
  createdAt: string;
  template: {
    name: string;
  } | null;
  _count: {
    outreaches: number;
  };
}

interface CampaignRow extends Campaign {
  stats: {
    contacts: number;
    sent: number;
    opened: number;
    replied: number;
    interviews: number;
    openRate: number;
    replyRate: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Brouillon", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "En pause", variant: "outline" },
};

const columns: ColumnDef<CampaignRow, unknown>[] = [
  {
    accessorKey: "name",
    header: "Campagne",
    cell: ({ row }) => (
      <div>
        <Link
          href={`/campaigns/${row.original.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">
          {row.original.targetRole} &middot; {row.original.targetCity}
        </p>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const config = statusConfig[row.original.status] || statusConfig.draft;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
    enableSorting: false,
  },
  {
    id: "template",
    header: "Template",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.template?.name ?? "-"}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "contacts",
    header: "Contacts",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.stats.contacts}</span>
    ),
    enableSorting: true,
    accessorFn: (row) => row.stats.contacts,
  },
  {
    id: "sent",
    header: "Envoyes",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.stats.sent}</span>
    ),
    enableSorting: true,
    accessorFn: (row) => row.stats.sent,
  },
  {
    id: "openRate",
    header: "Taux ouverture",
    cell: ({ row }) => {
      const rate = row.original.stats.openRate;
      return (
        <span
          className={cn(
            "text-sm font-medium",
            rate > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          )}
        >
          {rate}%
        </span>
      );
    },
    enableSorting: true,
    accessorFn: (row) => row.stats.openRate,
  },
  {
    id: "replyRate",
    header: "Taux reponse",
    cell: ({ row }) => {
      const rate = row.original.stats.replyRate;
      return (
        <span
          className={cn(
            "text-sm font-medium",
            rate > 0
              ? "text-violet-600 dark:text-violet-400"
              : "text-muted-foreground"
          )}
        >
          {rate}%
        </span>
      );
    },
    enableSorting: true,
    accessorFn: (row) => row.stats.replyRate,
  },
  {
    id: "interviews",
    header: "Entretiens",
    cell: ({ row }) => {
      const count = row.original.stats.interviews;
      return (
        <span
          className={cn(
            "text-sm font-medium",
            count > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          )}
        >
          {count}
        </span>
      );
    },
    enableSorting: true,
    accessorFn: (row) => row.stats.interviews,
  },
];

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/campaigns").then((r) => r.json()),
      fetch("/api/outreaches").then((r) => r.json()),
    ])
      .then(([campaignData, outreachData]) => {
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
        setOutreaches(Array.isArray(outreachData) ? outreachData : []);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const campaignRows: CampaignRow[] = useMemo(() => {
    const statsMap: Record<
      string,
      {
        contacts: number;
        sent: number;
        opened: number;
        replied: number;
        interviews: number;
      }
    > = {};

    for (const c of campaigns) {
      statsMap[c.id] = {
        contacts: c._count.outreaches,
        sent: 0,
        opened: 0,
        replied: 0,
        interviews: 0,
      };
    }

    for (const o of outreaches) {
      const s = statsMap[o.campaignId];
      if (!s) continue;

      if (o.status === "interview" || o.status === "entretien") {
        s.interviews++;
      }

      if (o.emails) {
        for (const e of o.emails) {
          if (e.status === "sent") {
            s.sent++;
            if (e.openedAt) s.opened++;
            if (e.repliedAt) s.replied++;
          }
        }
      }
    }

    return campaigns.map((c) => {
      const s = statsMap[c.id] || {
        contacts: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        interviews: 0,
      };
      return {
        ...c,
        stats: {
          ...s,
          openRate: s.sent > 0 ? Math.round((s.opened / s.sent) * 100) : 0,
          replyRate: s.sent > 0 ? Math.round((s.replied / s.sent) * 100) : 0,
        },
      };
    });
  }, [campaigns, outreaches]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campagnes"
        description="Gerez vos campagnes de prospection"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-1" />
            Nouvelle campagne
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={campaignRows}
        loading={loading}
        emptyState={{
          icon: Megaphone,
          title: "Aucune campagne",
          description: "Creez votre premiere campagne pour commencer la prospection.",
          actionLabel: "Nouvelle campagne",
          onAction: () => setShowForm(true),
        }}
      />

      <CampaignForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
