"use client";

interface KanbanCardProps {
  id: string;
  contactName: string;
  companyName: string;
  priority: number;
  lastContactDate: string | null;
}

const priorityColors: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-gray-100 text-gray-600",
};

export default function KanbanCard({
  id,
  contactName,
  companyName,
  priority,
  lastContactDate,
}: KanbanCardProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  const colorClass = priorityColors[priority] || priorityColors[3];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="text-sm font-medium text-gray-900">{contactName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{companyName}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
          P{priority}
        </span>
        {lastContactDate && (
          <span className="text-xs text-gray-400">
            {new Date(lastContactDate).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
    </div>
  );
}
