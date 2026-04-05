"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Priority badge config ---

const priorityConfig: Record<
  number,
  {
    label: string;
    variant: "destructive" | "default" | "secondary" | "outline";
    className?: string;
  }
> = {
  1: { label: "P1", variant: "destructive" },
  2: {
    label: "P2",
    variant: "default",
    className:
      "bg-orange-500/10 text-orange-600 border-transparent dark:text-orange-400",
  },
  3: {
    label: "P3",
    variant: "default",
    className:
      "bg-blue-500/10 text-blue-600 border-transparent dark:text-blue-400",
  },
  4: { label: "P4", variant: "secondary" },
  5: { label: "P5", variant: "secondary" },
};

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
  size = 16,
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

// --- Types ---

export interface KanbanCardProps {
  id: string;
  contactName: string;
  companyName: string;
  companyWebsite?: string | null;
  priority: number;
  lastContactDate: string | null;
  onClick?: () => void;
}

// --- Component ---

export default function KanbanCard({
  id,
  contactName,
  companyName,
  companyWebsite,
  priority,
  lastContactDate,
  onClick,
}: KanbanCardProps) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  const pConfig = priorityConfig[priority] || priorityConfig[4];

  return (
    <motion.div
      layout
      layoutId={id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={onClick}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card
          size="sm"
          className="shadow-sm hover:shadow-md transition-shadow p-0 cursor-pointer"
        >
          <CardContent className="p-3 space-y-1.5">
            {/* Contact name */}
            <p className="text-sm font-medium leading-tight">{contactName}</p>

            {/* Company */}
            <div className="flex items-center gap-1.5">
              <CompanyLogo
                companyName={companyName}
                companyWebsite={companyWebsite}
                size={16}
              />
              <span className="text-xs text-muted-foreground truncate">
                {companyName}
              </span>
            </div>

            {/* Footer: priority + date */}
            <div className="flex items-center justify-between pt-0.5">
              <Badge
                variant={pConfig.variant}
                className={pConfig.className}
              >
                {pConfig.label}
              </Badge>
              {lastContactDate && (
                <time className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lastContactDate), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </time>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
