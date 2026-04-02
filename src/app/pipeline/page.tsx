import KanbanBoard from "@/components/pipeline/kanban-board";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Suivez vos contacts dans le processus de prospection
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
