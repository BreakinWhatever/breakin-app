"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import KanbanBoard from "@/components/pipeline/kanban-board";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Campaign {
  id: string;
  name: string;
}

export default function PipelinePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
      });
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pipeline"
        actions={
          <Select
            value={selectedCampaign}
            onValueChange={(v) => setSelectedCampaign(v ?? "")}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Toutes les campagnes" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <KanbanBoard
        campaignFilter={selectedCampaign}
        onCampaignFilterChange={setSelectedCampaign}
      />
    </div>
  );
}
