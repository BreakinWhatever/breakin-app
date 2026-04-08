"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Building2,
  Briefcase,
  Globe,
  DollarSign,
  Calendar,
  Star,
  XCircle,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ApplyJobCard } from "@/components/jobs/apply-job-card";
import { useLatestOfferApplyJob } from "@/components/jobs/hooks";
import { deriveOfferStatus } from "@/components/jobs/job-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface OfferDetail {
  id: string;
  title: string;
  company: string;
  companyId: string | null;
  city: string;
  country: string;
  contractType: string;
  description: string;
  url: string;
  source: string;
  salary: string | null;
  matchScore: number | null;
  matchAnalysis: string | null;
  status: string;
  applyPlatform?: string | null;
  applyReadiness?: string | null;
  applyManifestStatus?: string | null;
  lastPreflightAt?: string | null;
  preflightError?: string | null;
  postedAt: string | null;
  createdAt: string;
}

function ScoreDisplay({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return <span className="text-5xl font-bold text-muted-foreground">--</span>;
  }

  let colorClass = "text-gray-500";
  if (score >= 80) colorClass = "text-emerald-500";
  else if (score >= 60) colorClass = "text-yellow-500";

  return <span className={`text-5xl font-bold ${colorClass}`}>{score}</span>;
}

const statusLabels: Record<string, string> = {
  new: "Nouveau",
  shortlisted: "Shortlist",
  apply_requested: "En cours",
  applied: "Postule",
  apply_failed: "Echec",
  ignored: "Ignore",
};

export default function OfferDetailPage() {
  const params = useParams();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { job: applyJob } = useLatestOfferApplyJob(typeof params.id === "string" ? params.id : null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/offers/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setOffer(null);
        } else {
          setOffer(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const [applying, setApplying] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!offer) return;
    const res = await fetch(`/api/offers/${offer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOffer(updated);
    }
  };

  const handleApply = async () => {
    if (!offer || applying) return;
    setApplying(true);
    const res = await fetch(`/api/offers/${offer.id}/apply`, { method: "POST" });
    if (res.ok) {
      const payload = await res.json();
      if (payload?.reason === "preflight_queued" || payload?.reason === "preflight_running") {
        setOffer((prev) => prev ? { ...prev, applyReadiness: "pending_preflight" } : prev);
        toast.message("Preparation du site d'apply en cours");
      } else if (payload?.reason === "manual_only" || payload?.reason === "blocked") {
        if (payload?.offer) {
          setOffer(payload.offer);
        }
        toast.error(payload?.offer?.preflightError || "Cette candidature demande une revue manuelle");
      } else if (payload?.offer) {
        setOffer(payload.offer);
      } else {
        setOffer((prev) => prev ? { ...prev, status: "apply_requested" } : prev);
      }
    }
    setApplying(false);
  };

  const effectiveStatus = offer ? deriveOfferStatus(offer.status, applyJob) : "";

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Offre introuvable</p>
        <Link href="/offres">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4 mr-1" />
            Retour aux offres
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/offres">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-3.5 mr-1" />
            Offres
          </Button>
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground truncate max-w-[300px]">
          {offer.title}
        </span>
      </div>

      <PageHeader
        title={offer.title}
        description={`${offer.company} - ${offer.city}`}
        actions={
          <Badge variant="outline">{statusLabels[effectiveStatus] || effectiveStatus}</Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entreprise</p>
                    <p className="text-sm font-medium">{offer.company}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ville</p>
                    <p className="text-sm">{offer.city}, {offer.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type de contrat</p>
                    <p className="text-sm">{offer.contractType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="text-sm capitalize">{offer.source}</p>
                  </div>
                </div>
                {offer.salary && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salaire</p>
                      <p className="text-sm">{offer.salary}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm">
                      {new Date(offer.postedAt || offer.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <Separator />

                {offer.applyReadiness && (
                  <>
                    <div className="flex items-start gap-3">
                      <Send className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fast Path</p>
                        <p className="text-sm">{formatApplyReadiness(offer.applyReadiness)}</p>
                      </div>
                    </div>
                    {offer.preflightError && (
                      <p className="text-xs text-destructive">{offer.preflightError}</p>
                    )}
                    <Separator />
                  </>
                )}

                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  Voir l&apos;offre originale
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {offer.description}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle>Analyse IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-4">
                <ScoreDisplay score={offer.matchScore} />
                <p className="text-xs text-muted-foreground mt-1">Match Score</p>
              </div>

              {offer.matchAnalysis ? (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {offer.matchAnalysis}
                  </p>
                </>
              ) : (
                <>
                  <Separator className="my-3" />
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Pas encore analyse
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button
                  variant={offer.status === "shortlisted" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleStatusUpdate("shortlisted")}
                >
                  <Star className="size-4 mr-1.5" />
                  {offer.status === "shortlisted" ? "Shortliste" : "Shortlister"}
                </Button>
                <Button
                  variant={offer.status === "ignored" ? "secondary" : "outline"}
                  className="w-full"
                  onClick={() => handleStatusUpdate("ignored")}
                >
                  <XCircle className="size-4 mr-1.5" />
                  {offer.status === "ignored" ? "Ignore" : "Ignorer"}
                </Button>
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
              </div>
            </CardContent>
          </Card>

          {applyJob && <ApplyJobCard job={applyJob} />}
        </div>
      </div>
    </div>
  );
}

function formatApplyReadiness(value?: string | null) {
  if (value === "ready") return "Pret";
  if (value === "pending_preflight") return "Preparation";
  if (value === "manual_only") return "Manuel";
  if (value === "blocked") return "Bloque";
  return value ?? "Inconnu";
}
