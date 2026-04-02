"use client";

import { useEffect, useState } from "react";
import MetricsBar from "@/components/dashboard/metrics-bar";
import ActionsPanel from "@/components/dashboard/actions-panel";

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

  // Default period: last 30 days
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });
  const [dateTo, setDateTo] = useState(() => formatDateForInput(new Date()));

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(Array.isArray(data) ? data : []);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble de votre activite de prospection
          </p>
        </div>
        <select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Toutes les campagnes</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Periode
          </span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 7);
              setDateFrom(formatDateForInput(d));
              setDateTo(formatDateForInput(new Date()));
            }}
            className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded border border-gray-200"
          >
            7j
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 30);
              setDateFrom(formatDateForInput(d));
              setDateTo(formatDateForInput(new Date()));
            }}
            className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded border border-gray-200"
          >
            30j
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 90);
              setDateFrom(formatDateForInput(d));
              setDateTo(formatDateForInput(new Date()));
            }}
            className="text-xs text-gray-400 hover:text-blue-600 px-2 py-1 rounded border border-gray-200"
          >
            90j
          </button>
        </div>
      </div>

      <MetricsBar
        campaignId={selectedCampaign}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
      <ActionsPanel campaignId={selectedCampaign} />
    </div>
  );
}
