"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template {
  id: string;
  name: string;
}

interface CampaignFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CampaignForm({
  open,
  onClose,
  onCreated,
}: CampaignFormProps) {
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCity, setTargetCity] = useState("Paris");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/templates")
        .then((r) => r.json())
        .then((data) => {
          setTemplates(Array.isArray(data) ? data : []);
        });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !targetRole || !targetCity) return;

    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetRole,
          targetCity,
          templateId: templateId || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      setName("");
      setTargetRole("");
      setTargetCity("Paris");
      setTemplateId("");
      toast.success("Campagne creee avec succes");
      onCreated();
      onClose();
    } catch {
      toast.error("Erreur lors de la creation de la campagne");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] flex flex-col p-0"
        showCloseButton
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>Nouvelle campagne</SheetTitle>
          <SheetDescription>
            Creez une campagne de prospection ciblee
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nom de la campagne</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Private Credit Paris Q1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-role">Role cible</Label>
              <Input
                id="campaign-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Ex: Analyst, Associate"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-city">Ville cible</Label>
              <Input
                id="campaign-city"
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Template (optionnel)</Label>
              <Select
                value={templateId}
                onValueChange={(value) => setTemplateId(value as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucun template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choisissez un template correspondant au role cible
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creation..." : "Creer"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
