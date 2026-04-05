"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TemplateData {
  id?: string;
  name: string;
  language: string;
  category: string;
  subject: string;
  body: string;
}

interface TemplateEditorProps {
  open: boolean;
  template: TemplateData | null;
  onClose: () => void;
  onSaved: () => void;
}

const VARIABLES = [
  "{firstName}",
  "{lastName}",
  "{companyName}",
  "{role}",
  "{city}",
  "{senderName}",
];

export default function TemplateEditor({
  open,
  template,
  onClose,
  onSaved,
}: TemplateEditorProps) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("fr");
  const [category, setCategory] = useState("initial");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setLanguage(template.language);
      setCategory(template.category);
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setName("");
      setLanguage("fr");
      setCategory("initial");
      setSubject("");
      setBody("");
    }
  }, [template, open]);

  function insertVariable(variable: string) {
    setBody((prev) => prev + variable);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !subject || !body) return;

    setSaving(true);
    try {
      const isEdit = template?.id;
      const url = isEdit ? `/api/templates/${template.id}` : "/api/templates";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          language,
          category,
          subject,
          body,
        }),
      });

      if (!res.ok) throw new Error("Failed to save template");
      toast.success(isEdit ? "Template modifie" : "Template cree");
      onSaved();
      onClose();
    } catch {
      toast.error("Erreur lors de la sauvegarde du template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[560px] sm:max-w-[560px] flex flex-col p-0"
        showCloseButton
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>
            {template?.id ? "Modifier le template" : "Nouveau template"}
          </SheetTitle>
          <SheetDescription>
            Configurez votre modele d&apos;email
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Nom</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Email initial FR"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Francais</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial</SelectItem>
                    <SelectItem value="followup_1">Relance 1</SelectItem>
                    <SelectItem value="followup_2">Relance 2</SelectItem>
                    <SelectItem value="followup_3">Relance 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Objet</Label>
              <Input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Candidature - {companyName}"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Corps du message</Label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {VARIABLES.map((v) => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => insertVariable(v)}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                required
                placeholder={"Bonjour {firstName},\n\nJe me permets de vous contacter..."}
                className="font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
