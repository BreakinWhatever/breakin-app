"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Brouillon", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  paused: { label: "En pause", variant: "outline" },
};

export default function CampaignList({ refreshKey }: { refreshKey?: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        Aucune campagne. Creez-en une pour commencer.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => {
        const config = statusConfig[c.status] || statusConfig.draft;
        return (
          <Link key={c.id} href={`/campaigns/${c.id}`}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold">
                      {c.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {c.targetRole} &middot; {c.targetCity}
                    </p>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{c._count.outreaches} contact(s)</span>
                  {c.template && <span>Template: {c.template.name}</span>}
                  <span>
                    Creee le{" "}
                    {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
