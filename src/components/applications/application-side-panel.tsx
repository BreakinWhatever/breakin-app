"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SidePanel } from "@/components/shared/side-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ExternalLink,
  Briefcase,
  Users,
  FileText,
  Sparkles,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { type ApplicationRow } from "./applications-table";

// --- Status config ---

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

// Status flow: draft -> applied -> interview -> offer -> accepted/rejected
const statusFlow: string[] = [
  "draft",
  "applied",
  "interview",
  "offer",
  "accepted",
];

// --- Component ---

interface ApplicationSidePanelProps {
  application: ApplicationRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onUpdated?: (updated: ApplicationRow) => void;
  onDeleted?: (id: string) => void;
}

export function ApplicationSidePanel({
  application,
  open,
  onOpenChange,
  onPrev,
  onNext,
  onUpdated,
  onDeleted,
}: ApplicationSidePanelProps) {
  const [notes, setNotes] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextStepDate, setNextStepDate] = useState<Date | undefined>(undefined);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync local state when application changes
  useEffect(() => {
    setNotes(application?.notes ?? "");
    setNextStep(application?.nextStep ?? "");
    setNextStepDate(
      application?.nextStepDate
        ? new Date(application.nextStepDate)
        : undefined
    );
  }, [application?.id, application?.notes, application?.nextStep, application?.nextStepDate]);

  const updateApplication = useCallback(
    async (data: Record<string, unknown>) => {
      if (!application) return;
      try {
        const res = await fetch(`/api/applications/${application.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const updated = await res.json();
          onUpdated?.(updated);
        }
      } catch (error) {
        console.error("Failed to update application:", error);
      }
    },
    [application, onUpdated]
  );

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      await updateApplication({ status: newStatus });
    },
    [updateApplication]
  );

  const handleNotesBlur = useCallback(() => {
    if (application && notes !== (application.notes ?? "")) {
      updateApplication({ notes: notes || null });
    }
  }, [application, notes, updateApplication]);

  const handleNextStepBlur = useCallback(() => {
    if (application && nextStep !== (application.nextStep ?? "")) {
      updateApplication({ nextStep: nextStep || null });
    }
  }, [application, nextStep, updateApplication]);

  const handleNextStepDateChange = useCallback(
    (date: Date | undefined) => {
      setNextStepDate(date);
      updateApplication({
        nextStepDate: date ? date.toISOString() : null,
      });
    },
    [updateApplication]
  );

  const handleDelete = useCallback(async () => {
    if (!application) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setShowDeleteDialog(false);
        onOpenChange(false);
        onDeleted?.(application.id);
      }
    } catch (error) {
      console.error("Failed to delete application:", error);
    } finally {
      setDeleting(false);
    }
  }, [application, onOpenChange, onDeleted]);

  const handleGenerateCoverLetter = useCallback(async () => {
    if (!application) return;
    try {
      const res = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: application.offer?.id ?? null,
          language: "fr",
        }),
      });
      if (res.ok) {
        const stub = await res.json();
        // Create the cover letter
        const createRes = await fetch("/api/cover-letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: stub.title,
            body: stub.body,
            language: stub.language,
            offerId: application.offer?.id ?? null,
          }),
        });
        if (createRes.ok) {
          const coverLetter = await createRes.json();
          // Link it to the application
          await updateApplication({ coverLetterId: coverLetter.id });
        }
      }
    } catch (error) {
      console.error("Failed to generate cover letter:", error);
    }
  }, [application, updateApplication]);

  if (!application) return null;

  const sConfig = statusConfig[application.status] || statusConfig.draft;
  const currentIndex = statusFlow.indexOf(application.status);

  return (
    <>
      <SidePanel
        open={open}
        onOpenChange={onOpenChange}
        title={application.role}
        subtitle={application.companyName}
        badge={{ label: sConfig.label, variant: sConfig.variant === "destructive" ? "destructive" : "secondary" }}
        onPrev={onPrev}
        onNext={onNext}
      >
        <div className="space-y-5">
          {/* --- Status section --- */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Statut</p>
            <Badge variant={sConfig.variant} className={sConfig.className}>
              {sConfig.label}
            </Badge>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {statusFlow.map((s, i) => {
                const sc = statusConfig[s];
                const isCurrent = s === application.status;
                const isNext = i === currentIndex + 1;
                return (
                  <Button
                    key={s}
                    variant={isCurrent ? "default" : "outline"}
                    size="xs"
                    disabled={isCurrent}
                    className={isNext ? "ring-1 ring-ring" : ""}
                    onClick={() => handleStatusChange(s)}
                  >
                    {sc?.label ?? s}
                  </Button>
                );
              })}
              {application.status !== "rejected" &&
                application.status !== "withdrawn" && (
                  <>
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={() => handleStatusChange("rejected")}
                    >
                      Refuse
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleStatusChange("withdrawn")}
                    >
                      Retire
                    </Button>
                  </>
                )}
            </div>
          </div>

          <Separator />

          {/* --- Links --- */}
          <div className="space-y-2">
            {application.offer && (
              <Link
                href={`/offres/${application.offer.id}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Briefcase className="size-4" />
                Voir l&apos;offre
                {application.offer.matchScore != null && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {application.offer.matchScore}%
                  </Badge>
                )}
                <ExternalLink className="size-3" />
              </Link>
            )}
            {application.contact && (
              <Link
                href={`/contacts/${application.contact.id}`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Users className="size-4" />
                {application.contact.firstName} {application.contact.lastName}
                <ExternalLink className="size-3" />
              </Link>
            )}
          </div>

          <Separator />

          {/* --- Cover letter --- */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Lettre de motivation
            </p>
            {application.coverLetter ? (
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {application.coverLetter.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {application.coverLetter.body}
                </p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCoverLetter}
              >
                <Sparkles className="size-3.5 mr-1.5" />
                Generer une lettre
              </Button>
            )}
          </div>

          <Separator />

          {/* --- Notes --- */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Ajouter des notes..."
              className="min-h-20"
            />
          </div>

          <Separator />

          {/* --- Next step --- */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Prochaine etape
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                onBlur={handleNextStepBlur}
                placeholder="Ex: Entretien RH"
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" size="icon">
                      <CalendarIcon className="size-4" />
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={nextStepDate}
                    onSelect={handleNextStepDateChange}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {nextStepDate && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {nextStepDate.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          <Separator />

          {/* --- Danger zone --- */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Zone de danger</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Supprimer
            </Button>
          </div>
        </div>
      </SidePanel>

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la candidature</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer la candidature pour{" "}
              <strong>{application.role}</strong> chez{" "}
              <strong>{application.companyName}</strong> ? Cette action est
              irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Annuler
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
