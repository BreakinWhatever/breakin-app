import MetricsBar from "@/components/dashboard/metrics-bar";
import ActionsPanel from "@/components/dashboard/actions-panel";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue d&apos;ensemble de votre activit&eacute; de prospection
        </p>
      </div>
      <MetricsBar />
      <ActionsPanel />
    </div>
  );
}
