"use client";

import { useState, useCallback } from "react";
import CampaignList from "@/components/campaigns/campaign-list";
import CampaignForm from "@/components/campaigns/campaign-form";

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-sm text-gray-500 mt-1">
            G&eacute;rez vos campagnes de prospection
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          Nouvelle campagne
        </button>
      </div>
      <CampaignList refreshKey={refreshKey} />
      <CampaignForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
