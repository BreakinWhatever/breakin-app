"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { Users } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  priority: number;
  source: string;
  company: {
    id: string;
    name: string;
    website: string | null;
  };
  outreaches?: {
    id: string;
    status: string;
    lastContactDate: string | null;
    emails?: {
      id: string;
      type: string;
      subject: string;
      body: string;
      status: string;
      sentAt: string | null;
      createdAt: string;
    }[];
  }[];
}

// --- Helpers ---

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
        className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium shrink-0"
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
      className="rounded-full shrink-0 bg-muted"
      onError={() => setImgError(true)}
    />
  );
}

function CopyableEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={handleCopy}
        >
          <span className="truncate max-w-[180px]">{email}</span>
          {copied ? (
            <Check className="size-3 text-emerald-500 shrink-0" />
          ) : (
            <Copy className="size-3 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity" />
          )}
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copie !" : "Copier l'email"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// --- Priority badge config ---

const priorityConfig: Record<number, { label: string; variant: "destructive" | "default" | "secondary" | "outline"; className?: string }> = {
  1: { label: "P1", variant: "destructive" },
  2: { label: "P2", variant: "default", className: "bg-orange-500/10 text-orange-600 border-transparent dark:text-orange-400" },
  3: { label: "P3", variant: "default", className: "bg-blue-500/10 text-blue-600 border-transparent dark:text-blue-400" },
  4: { label: "P4", variant: "secondary" },
  5: { label: "P5", variant: "secondary" },
};

// --- Column definitions ---

export const contactColumns: ColumnDef<ContactRow, unknown>[] = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    id: "name",
    header: "Nom",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "Titre",
    enableSorting: true,
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorFn: (row) => row.company.name,
    id: "company",
    header: "Entreprise",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CompanyLogo
          companyName={row.original.company.name}
          companyWebsite={row.original.company.website}
          size={20}
        />
        <span className="text-sm">{row.original.company.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    enableSorting: false,
    cell: ({ row }) => <CopyableEmail email={row.original.email} />,
  },
  {
    accessorKey: "priority",
    header: "Priorite",
    enableSorting: true,
    cell: ({ getValue }) => {
      const priority = getValue() as number;
      const config = priorityConfig[priority] || priorityConfig[4];
      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    cell: ({ getValue }) => (
      <Badge variant="outline" className="capitalize">
        {getValue() as string}
      </Badge>
    ),
  },
];

// --- Main component ---

interface ContactsTableProps {
  contacts: ContactRow[];
  loading: boolean;
  onRowClick: (contact: ContactRow) => void;
}

export default function ContactsTable({
  contacts,
  loading,
  onRowClick,
}: ContactsTableProps) {
  return (
    <DataTable
      columns={contactColumns}
      data={contacts}
      loading={loading}
      onRowClick={onRowClick}
      emptyState={{
        icon: Users,
        title: "Aucun contact",
        description:
          "Importez vos premiers contacts depuis Apollo ou ajoutez-les manuellement.",
      }}
    />
  );
}
