"use client";

import { useState } from "react";

interface KanbanCardProps {
  id: string;
  contactName: string;
  companyName: string;
  companyWebsite?: string | null;
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

function extractDomain(website: string): string {
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

function CompanyLogo({
  companyName,
  companyWebsite,
  size = 20,
}: {
  companyName: string;
  companyWebsite?: string | null;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const domain = companyWebsite ? extractDomain(companyWebsite) : null;

  if (!domain || imgError) {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500 text-xs font-medium flex-shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {companyName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={companyName}
      width={size}
      height={size}
      className="rounded-full flex-shrink-0 bg-gray-100"
      onError={() => setImgError(true)}
    />
  );
}

export default function KanbanCard({
  id,
  contactName,
  companyName,
  companyWebsite,
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
      <div className="flex items-center gap-1.5 mt-0.5">
        <CompanyLogo
          companyName={companyName}
          companyWebsite={companyWebsite}
          size={16}
        />
        <p className="text-xs text-gray-500">{companyName}</p>
      </div>
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
