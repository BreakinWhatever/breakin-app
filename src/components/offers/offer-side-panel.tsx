"use client";

import Link from "next/link";
import { SidePanel } from "@/components/shared/side-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Building2,
  Briefcase,
  Globe,
  DollarSign,
  ExternalLink,
  Send,
} from "lucide-react";
import { CompanyLogo } from "@/components/shared/company-logo";
import type { OfferRow } from "./offers-table";

// --- Score display ---

function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-2xl font-bold text-muted-foreground">--</span>;
  }

  let colorClass = "text-gray-500";
  if (score >= 80) colorClass = "text-emerald-500";
  else if (score >= 60) colorClass = "text-yellow-500";

  return <span className={`text-4xl font-bold ${colorClass}`}>{score}</span>;
}

// --- Info row ---

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

// --- Full offer type for panel (may have extra fields) ---

export interface OfferPanelData extends OfferRow {
  salary?: string | null;
  matchAnalysis?: string | null;
  description?: string;
}

// --- Main component ---

interface OfferSidePanelProps {
  offer: OfferPanelData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function OfferSidePanel({
  offer,
  open,
  onOpenChange,
  onPrev,
  onNext,
}: OfferSidePanelProps) {
  if (!offer) return null;

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    new: { label: "Nouveau", variant: "default" },
    shortlisted: { label: "Shortlist", variant: "outline" },
    applied: { label: "Postule", variant: "default" },
    ignored: { label: "Ignore", variant: "secondary" },
  };
  const sConfig = statusConfig[offer.status] || statusConfig.new;

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={offer.title}
      subtitle={
        <div className="flex items-center gap-2">
          <CompanyLogo company={offer.company} size="sm" />
          <span>{offer.company}</span>
        </div>
      }
      badge={{ label: sConfig.label, variant: sConfig.variant }}
      onPrev={onPrev}
      onNext={onNext}
    >
      {/* Score */}
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <ScoreDisplay score={offer.matchScore} />
          <p className="text-xs text-muted-foreground mt-1">Match Score</p>
        </div>
      </div>

      <Separator className="my-3" />

      {/* Info */}
      <div className="space-y-1">
        <InfoRow icon={Building2} label="Entreprise" value={offer.company} />
        <InfoRow icon={MapPin} label="Ville" value={offer.city} />
        <InfoRow icon={Briefcase} label="Type de contrat" value={offer.contractType} />
        <InfoRow icon={Globe} label="Source" value={offer.source} />
        <InfoRow icon={DollarSign} label="Salaire" value={offer.salary} />
      </div>

      {/* AI Analysis */}
      {offer.matchAnalysis && (
        <>
          <Separator className="my-3" />
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
              Analyse IA
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {offer.matchAnalysis}
            </p>
          </div>
        </>
      )}

      <Separator className="my-3" />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Link href={`/offres/${offer.id}`}>
          <Button variant="default" className="w-full">
            Voir detail
          </Button>
        </Link>
        <Button variant="outline" className="w-full" disabled>
          <Send className="size-4 mr-1.5" />
          Postuler
        </Button>
        {offer.url && (
          <a href={offer.url} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="w-full">
              <ExternalLink className="size-4 mr-1.5" />
              Voir l&apos;offre originale
            </Button>
          </a>
        )}
      </div>
    </SidePanel>
  );
}
