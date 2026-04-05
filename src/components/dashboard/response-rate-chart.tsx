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
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Email {
  id: string;
  status: string;
  repliedAt: string | null;
  outreach: {
    campaignId: string;
    campaign: {
      name: string;
    };
  };
}

interface CampaignRate {
  campaign: string;
  totalSent: number;
  replied: number;
  rate: number;
}

interface ResponseRateChartProps {
  campaignId?: string;
}

export default function ResponseRateChart({
  campaignId,
}: ResponseRateChartProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = campaignId
      ? `?campaignId=${encodeURIComponent(campaignId)}`
      : "";
    fetch(`/api/emails${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEmails(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  const chartData: CampaignRate[] = useMemo(() => {
    const sentEmails = emails.filter((e) => e.status === "sent");
    if (sentEmails.length === 0) return [];

    // Group by campaign
    const grouped: Record<string, { name: string; sent: number; replied: number }> = {};
    for (const email of sentEmails) {
      const cId = email.outreach?.campaignId || "unknown";
      const cName = email.outreach?.campaign?.name || "Sans campagne";
      if (!grouped[cId]) {
        grouped[cId] = { name: cName, sent: 0, replied: 0 };
      }
      grouped[cId].sent++;
      if (email.repliedAt) {
        grouped[cId].replied++;
      }
    }

    return Object.values(grouped)
      .map((g) => ({
        campaign: g.name,
        totalSent: g.sent,
        replied: g.replied,
        rate: g.sent > 0 ? Math.round((g.replied / g.sent) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [emails]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Taux de reponse par campagne</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="var(--color-border)"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="campaign"
              width={140}
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
                const campaign = props.payload as unknown as CampaignRate;
                return [
                  `${value}% (${campaign.replied}/${campaign.totalSent})`,
                  "Taux de reponse",
                ];
              }}
            />
            <Bar dataKey="rate" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={24}>
              <LabelList
                dataKey="rate"
                position="right"
                formatter={(v) => `${v}%`}
                style={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
