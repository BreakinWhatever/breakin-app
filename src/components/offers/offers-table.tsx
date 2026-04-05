"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface OfferRow {
  id: string;
  title: string;
  company: string;
  city: string;
  contractType: string;
  source: string;
  matchScore: number | null;
  status: string;
  postedAt: string | null;
  createdAt: string;
  url: string;
}

// --- Score badge config ---

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-muted-foreground">--</span>;
  }

  let className = "bg-gray-500/10 text-gray-600 border-transparent dark:text-gray-400";
  if (score >= 80) {
    className = "bg-emerald-500/10 text-emerald-600 border-transparent dark:text-emerald-400";
  } else if (score >= 60) {
    className = "bg-yellow-500/10 text-yellow-600 border-transparent dark:text-yellow-400";
  }

  return (
    <Badge variant="default" className={className}>
      {score}
    </Badge>
  );
}

// --- Status badge config ---

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }> = {
  new: { label: "Nouveau", variant: "default" },
  shortlisted: { label: "Shortlist", variant: "outline", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  applied: { label: "Postule", variant: "default", className: "bg-emerald-500/10 text-emerald-600 border-transparent dark:text-emerald-400" },
  ignored: { label: "Ignore", variant: "secondary" },
};

// --- Column definitions ---

export const offerColumns: ColumnDef<OfferRow, unknown>[] = [
  {
    accessorKey: "matchScore",
    header: "Score",
    enableSorting: true,
    cell: ({ getValue }) => <ScoreBadge score={getValue() as number | null} />,
  },
  {
    accessorKey: "title",
    header: "Titre",
    enableSorting: true,
    cell: ({ getValue }) => {
      const title = getValue() as string;
      return (
        <span className="text-sm font-medium text-foreground truncate max-w-[280px] block">
          {title.length > 40 ? `${title.substring(0, 40)}...` : title}
        </span>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Entreprise",
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "city",
    header: "Ville",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "contractType",
    header: "Type",
    enableSorting: false,
    cell: ({ getValue }) => (
      <Badge variant="outline">{getValue() as string}</Badge>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    cell: ({ getValue }) => (
      <Badge variant="secondary" className="capitalize">
        {getValue() as string}
      </Badge>
    ),
  },
  {
    accessorFn: (row) => row.postedAt || row.createdAt,
    id: "date",
    header: "Date",
    enableSorting: true,
    cell: ({ getValue }) => {
      const dateStr = getValue() as string;
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr })}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    enableSorting: false,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const config = statusConfig[status] || statusConfig.new;
      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
];

// --- Main component ---

interface OffersTableProps {
  offers: OfferRow[];
  loading: boolean;
  onRowClick: (offer: OfferRow) => void;
}

export default function OffersTable({
  offers,
  loading,
  onRowClick,
}: OffersTableProps) {
  return (
    <DataTable
      columns={offerColumns}
      data={offers}
      loading={loading}
      onRowClick={onRowClick}
      emptyState={{
        icon: Briefcase,
        title: "Aucune offre",
        description:
          "Lancez un scraping pour importer des offres d'emploi.",
      }}
    />
  );
}
