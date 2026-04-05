"use client";

import { useEffect, useState } from "react";
import MetricsBar from "@/components/dashboard/metrics-bar";
import ActionsPanel from "@/components/dashboard/actions-panel";
import PipelineFunnel from "@/components/dashboard/pipeline-funnel";
import ActivityHeatmap from "@/components/dashboard/activity-heatmap";
import ResponseRateChart from "@/components/dashboard/response-rate-chart";
import { PageHeader } from "@/components/shared/page-header";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  name: string;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  // Initialize dates only on client side to avoid hydration mismatch
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const now = new Date();
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setDateFrom(formatDateForInput(d));
    setDateTo(formatDateForInput(now));
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
      });
  }, []);

  function setPeriod(days: number) {
    const now = new Date();
    const d = new Date();
    d.setDate(d.getDate() - days);
    setDateFrom(formatDateForInput(d));
    setDateTo(formatDateForInput(now));
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de votre activite de prospection"
        actions={
          <Select
            value={selectedCampaign}
            onValueChange={(val) => setSelectedCampaign(val ?? "")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les campagnes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les campagnes</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Periode
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Du</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Au</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[150px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPeriod(7)}>
            7j
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod(30)}>
            30j
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPeriod(90)}>
            90j
          </Button>
        </div>
      </div>

      <MetricsBar
        campaignId={selectedCampaign}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <ActionsPanel campaignId={selectedCampaign} />

      {/* Analytics section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Analytiques</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PipelineFunnel campaignId={selectedCampaign} />
          <ResponseRateChart campaignId={selectedCampaign} />
        </div>
        <ActivityHeatmap campaignId={selectedCampaign} />
      </div>
    </div>
  );
}
