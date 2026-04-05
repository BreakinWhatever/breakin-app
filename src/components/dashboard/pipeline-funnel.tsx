"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Outreach {
  id: string;
  status: string;
}

interface FunnelStage {
  stage: string;
  count: number;
  color: string;
  conversionRate: string;
}

const STAGE_ORDER = [
  { key: "contacted", label: "Contacte", color: "#3b82f6" },
  { key: "followup_1", label: "Relance 1", color: "#eab308" },
  { key: "followup_2", label: "Relance 2", color: "#f59e0b" },
  { key: "followup_3", label: "Relance 3", color: "#f97316" },
  { key: "replied", label: "Repondu", color: "#22c55e" },
  { key: "interview", label: "Entretien", color: "#a855f7" },
  { key: "offer", label: "Offre", color: "#10b981" },
];

// Count all outreaches that reached at least this stage
// E.g., "replied" includes everyone with status replied, interview, or offer
function countReachedStage(outreaches: Outreach[], stageIndex: number): number {
  const reachedStatuses = STAGE_ORDER.slice(stageIndex).map((s) => s.key);
  // Also count "followed_up" as a legacy alias for followup_1+
  return outreaches.filter(
    (o) =>
      reachedStatuses.includes(o.status) ||
      (stageIndex <= 1 && o.status === "followed_up")
  ).length;
}

interface PipelineFunnelProps {
  campaignId?: string;
}

export default function PipelineFunnel({ campaignId }: PipelineFunnelProps) {
  const [outreaches, setOutreaches] = useState<Outreach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = campaignId
      ? `?campaignId=${encodeURIComponent(campaignId)}`
      : "";
    fetch(`/api/outreaches${params}`)
      .then((r) => r.json())
      .then((data) => {
        const items = (Array.isArray(data) ? data : []).filter(
          (o: Outreach) => o.status !== "identified"
        );
        setOutreaches(items);
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  const funnelData: FunnelStage[] = useMemo(() => {
    if (outreaches.length === 0) return [];

    return STAGE_ORDER.map((stage, i) => {
      const count = countReachedStage(outreaches, i);
      const prevCount = i === 0 ? outreaches.length : countReachedStage(outreaches, i - 1);
      const rate =
        prevCount > 0 ? `${Math.round((count / prevCount) * 100)}%` : "-";
      return {
        stage: stage.label,
        count,
        color: stage.color,
        conversionRate: rate,
      };
    }).filter((s) => s.count > 0 || STAGE_ORDER.findIndex((st) => st.label === s.stage) < 4);
  }, [outreaches]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (funnelData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funnel de conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-border)"
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="stage"
              width={100}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(value, _name, props) => {
                const stage = props.payload as unknown as FunnelStage;
                return [`${value} (${stage.conversionRate})`, "Contacts"];
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
              {funnelData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
