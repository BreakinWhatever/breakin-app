"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SidePanel } from "@/components/shared/side-panel";
import { ApplyJobCard } from "@/components/jobs/apply-job-card";
import { useLatestOfferApplyJob } from "@/components/jobs/hooks";
import { deriveOfferStatus } from "@/components/jobs/job-progress";
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
  onApplied,
}: OfferSidePanelProps & { onApplied?: (id: string, jobId?: string) => void }) {
  const [applying, setApplying] = useState(false);
  const { job: applyJob } = useLatestOfferApplyJob(offer?.id);

  const handleApply = async () => {
    if (!offer || applying) return;
    setApplying(true);
    const res = await fetch(`/api/offers/${offer.id}/apply`, { method: "POST" });
    if (res.ok) {
      const payload = await res.json().catch(() => null);
      if (payload?.reason === "preflight_queued" || payload?.reason === "preflight_running") {
        toast.message("Preparation du site d'apply en cours");
      } else if (payload?.reason === "manual_only" || payload?.reason === "blocked") {
        toast.error(payload?.offer?.preflightError || "Cette candidature demande une revue manuelle");
      } else {
        onApplied?.(offer.id, payload?.jobId);
      }
    }
    setApplying(false);
  };

  if (!offer) return null;

  const effectiveStatus = deriveOfferStatus(offer.status, applyJob);

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    new: { label: "Nouveau", variant: "default" },
    shortlisted: { label: "Shortlist", variant: "outline" },
    apply_requested: { label: "En cours", variant: "outline" },
    applied: { label: "Postule", variant: "default" },
    apply_failed: { label: "Echec", variant: "destructive" },
    ignored: { label: "Ignore", variant: "secondary" },
  };
  const sConfig = statusConfig[effectiveStatus] || statusConfig.new;

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={offer.title}
      subtitle={
        <span className="inline-flex items-center gap-2">
          <CompanyLogo company={offer.company} size="sm" />
          <span>{offer.company}</span>
        </span>
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
          {offer.applyReadiness && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Apply: {formatApplyReadiness(offer.applyReadiness)}
            </p>
          )}
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
        <Button
          variant="default"
          className="w-full"
          onClick={handleApply}
          disabled={applying || effectiveStatus === "applied" || effectiveStatus === "apply_requested"}
        >
          <Send className="size-4 mr-1.5" />
          {effectiveStatus === "applied"
            ? "Postulé ✓"
            : effectiveStatus === "apply_requested"
            ? "En cours..."
            : applying
            ? "Lancement..."
            : "Postuler"}
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

      {applyJob && (
        <>
          <Separator className="my-3" />
          <ApplyJobCard job={applyJob} compact />
        </>
      )}
    </SidePanel>
  );
}

function formatApplyReadiness(value?: string | null) {
  if (value === "ready") return "Pret";
  if (value === "pending_preflight") return "Preparation";
  if (value === "manual_only") return "Manuel";
  if (value === "blocked") return "Bloque";
  return value ?? "Inconnu";
}
