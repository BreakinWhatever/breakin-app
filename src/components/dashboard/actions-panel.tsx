"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Inbox } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

interface Suggestion {
  id: string;
  subject: string;
  body: string;
  type: string;
  status: string;
  createdAt: string;
  outreach: {
    id: string;
    campaignId: string;
    status: string;
    contact: {
      firstName: string;
      lastName: string;
      company: {
        name: string;
      };
    };
    campaign: {
      name: string;
    };
  };
}

interface ActionsPanelProps {
  campaignId?: string;
}

/* --- Skeleton loading state --- */

function ActionsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* --- Suggestion card --- */

function SuggestionCard({
  suggestion,
  onApprove,
  onIgnore,
  processing,
}: {
  suggestion: Suggestion;
  onApprove: (id: string) => void;
  onIgnore: (id: string) => void;
  processing: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {suggestion.outreach.contact.firstName}{" "}
            {suggestion.outreach.contact.lastName}
            <span className="ml-2 text-muted-foreground font-normal">
              — {suggestion.outreach.contact.company.name}
            </span>
          </CardTitle>
          <Badge variant="secondary">
            {suggestion.type === "followup"
              ? "Relance"
              : suggestion.type === "reponse" || suggestion.type === "reply"
                ? "Reponse"
                : "Initial"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{suggestion.subject}</p>
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
              {suggestion.body}
            </p>
          </CardContent>
        </Card>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onApprove(suggestion.id)}
            disabled={processing}
          >
            {processing ? "Envoi..." : "Approuver & Envoyer"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onIgnore(suggestion.id)}
            disabled={processing}
          >
            Ignorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* --- Main component --- */

export default function ActionsPanel({ campaignId }: ActionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSuggestions = useCallback(() => {
    setLoading(true);
    fetch("/api/agent/suggestions")
      .then((r) => r.json())
      .then((data) => {
        setSuggestions(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  /* --- Filtering --- */

  const filtered = campaignId
    ? suggestions.filter((s) => s.outreach.campaignId === campaignId)
    : suggestions;

  const envois = useMemo(
    () =>
      filtered.filter(
        (s) => s.outreach.status === "identified" || s.type === "initial"
      ),
    [filtered]
  );
  const relances = useMemo(
    () =>
      filtered.filter(
        (s) =>
          s.outreach.status === "contacted" ||
          s.outreach.status === "followed_up" ||
          s.outreach.status === "followup_1" ||
          s.outreach.status === "followup_2" ||
          s.outreach.status === "followup_3" ||
          s.type === "followup"
      ),
    [filtered]
  );
  const reponses = useMemo(
    () => filtered.filter((s) => s.outreach.status === "replied"),
    [filtered]
  );

  /* --- Actions --- */

  async function handleApproveAndSend(emailId: string) {
    setProcessing(emailId);
    try {
      const approveRes = await fetch(`/api/emails/${emailId}/approve`, {
        method: "POST",
      });
      if (!approveRes.ok) throw new Error("Failed to approve");

      const sendRes = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
      });
      if (!sendRes.ok) {
        const err = await sendRes.json();
        throw new Error(err.error || "Failed to send");
      }

      setSuggestions((prev) => prev.filter((s) => s.id !== emailId));
      toast.success("Email approuve et envoye");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setProcessing(null);
    }
  }

  async function handleIgnore(emailId: string) {
    setProcessing(emailId);
    try {
      await fetch(`/api/emails/${emailId}/approve`, { method: "POST" });
      setSuggestions((prev) => prev.filter((s) => s.id !== emailId));
      toast.success("Email ignore");
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setProcessing(null);
    }
  }

  /* --- Render tab content --- */

  function renderSuggestions(items: Suggestion[]) {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={Inbox}
          title="Aucune suggestion"
          description="Lancez l'agent pour generer des brouillons."
        />
      );
    }

    return (
      <div className="space-y-4">
        {items.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onApprove={handleApproveAndSend}
            onIgnore={handleIgnore}
            processing={processing === s.id}
          />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suggestions de l&apos;agent</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionsSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggestions de l&apos;agent</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="envois">
          <TabsList variant="line">
            <TabsTrigger value="envois">
              Envois
              <Badge variant="secondary" className="ml-1.5">{envois.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="relances">
              Relances
              <Badge variant="secondary" className="ml-1.5">{relances.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="reponses">
              Reponses
              <Badge variant="secondary" className="ml-1.5">{reponses.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="envois" className="pt-4">
            {renderSuggestions(envois)}
          </TabsContent>
          <TabsContent value="relances" className="pt-4">
            {renderSuggestions(relances)}
          </TabsContent>
          <TabsContent value="reponses" className="pt-4">
            {renderSuggestions(reponses)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
