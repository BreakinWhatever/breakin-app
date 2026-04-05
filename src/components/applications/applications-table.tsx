"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { ClipboardList } from "lucide-react";

export interface ApplicationRow {
  id: string;
  companyName: string;
  role: string;
  source: string;
  status: string;
  appliedAt: string | null;
  nextStep: string | null;
  nextStepDate: string | null;
  notes: string | null;
  createdAt: string;
  offer: {
    id: string;
    title: string;
    matchScore: number | null;
  } | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  coverLetter?: {
    id: string;
    title: string;
    body: string;
  } | null;
}

// --- Source badge config ---

const sourceConfig: Record<string, string> = {
  manual: "Manuel",
  scraping: "Scraping",
  referral: "Referral",
  linkedin: "LinkedIn",
};

// --- Status badge config ---

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  draft: { label: "Brouillon", variant: "secondary" },
  applied: {
    label: "Postule",
    variant: "default",
    className:
      "bg-blue-500/10 text-blue-600 border-transparent dark:text-blue-400",
  },
  interview: {
    label: "Entretien",
    variant: "default",
    className:
      "bg-yellow-500/10 text-yellow-600 border-transparent dark:text-yellow-400",
  },
  offer: {
    label: "Offre",
    variant: "default",
    className:
      "bg-emerald-500/10 text-emerald-600 border-transparent dark:text-emerald-400",
  },
  accepted: {
    label: "Accepte",
    variant: "default",
    className:
      "bg-emerald-500/15 text-emerald-700 border-transparent font-semibold dark:text-emerald-300",
  },
  rejected: {
    label: "Refuse",
    variant: "destructive",
  },
  withdrawn: {
    label: "Retire",
    variant: "default",
    className:
      "bg-gray-500/10 text-gray-500 border-transparent dark:text-gray-400",
  },
};

// --- Relative date formatter ---

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)}sem`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// --- Column definitions ---

export const applicationColumns: ColumnDef<ApplicationRow, unknown>[] = [
  {
    accessorKey: "role",
    header: "Role",
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "companyName",
    header: "Entreprise",
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    cell: ({ getValue }) => {
      const source = getValue() as string;
      return (
        <Badge variant="outline" className="capitalize">
          {sourceConfig[source] ?? source}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    enableSorting: false,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const config = statusConfig[status] || statusConfig.draft;
      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorFn: (row) => row.appliedAt || row.createdAt,
    id: "date",
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => {
      const dateStr = row.original.appliedAt || row.original.createdAt;
      return (
        <span className="text-sm text-muted-foreground">
          {formatRelativeDate(dateStr)}
        </span>
      );
    },
  },
  {
    accessorKey: "nextStep",
    header: "Prochaine etape",
    enableSorting: false,
    cell: ({ row }) => {
      const { nextStep, nextStepDate } = row.original;
      if (!nextStep) {
        return (
          <span className="text-sm text-muted-foreground">-</span>
        );
      }
      return (
        <div className="text-sm">
          <span>{nextStep}</span>
          {nextStepDate && (
            <span className="text-muted-foreground ml-1.5">
              {new Date(nextStepDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      );
    },
  },
];

// --- Main component ---

interface ApplicationsTableProps {
  applications: ApplicationRow[];
  loading: boolean;
  onRowClick: (application: ApplicationRow) => void;
}

export default function ApplicationsTable({
  applications,
  loading,
  onRowClick,
}: ApplicationsTableProps) {
  return (
    <DataTable
      columns={applicationColumns}
      data={applications}
      loading={loading}
      onRowClick={onRowClick}
      emptyState={{
        icon: ClipboardList,
        title: "Aucune candidature",
        description:
          "Ajoutez votre premiere candidature pour commencer le suivi.",
      }}
    />
  );
}
