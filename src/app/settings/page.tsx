"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    maxEmailsPerDay: "20",
    sendOnWeekends: "false",
    followUpSpacing: "3,5,7",
    maxFollowUps: "3",
    defaultLanguage: "fr",
    apolloApiKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // CV upload state
  const [cvInfo, setCvInfo] = useState<{
    exists: boolean;
    filename?: string;
    path?: string;
  }>({ exists: false });
  const [cvUploading, setCvUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .finally(() => setLoading(false));

    // Fetch CV info
    fetch("/api/cv")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setCvInfo(data);
        }
      });
  }, []);

  async function handleCvUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptes.");
      return;
    }

    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCvInfo(data);
      toast.success("CV uploade avec succes !");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Erreur lors de l'upload du CV.");
    } finally {
      setCvUploading(false);
    }
  }

  async function handleCvDelete() {
    setCvUploading(true);
    try {
      const res = await fetch("/api/cv", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setCvInfo({ exists: false });
      toast.success("CV supprime.");
    } catch {
      toast.error("Erreur lors de la suppression du CV.");
    } finally {
      setCvUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Parametres sauvegardes");
    } catch {
      toast.error("Erreur lors de la sauvegarde des parametres");
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full max-w-2xl" />
        <Skeleton className="h-80 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parametres"
        description="Configurez le comportement de la plateforme"
      />

      {/* CV Upload Section */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Curriculum Vitae</CardTitle>
          <CardDescription>
            Fichier PDF uniquement. Ce CV sera utilise pour vos candidatures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cvInfo.exists && cvInfo.filename && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="size-5 text-primary shrink-0" />
              <a
                href={cvInfo.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-medium truncate"
              >
                {cvInfo.filename}
              </a>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCvDelete}
                disabled={cvUploading}
                className="ml-auto shrink-0"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="flex-1"
            />
            <Button
              onClick={handleCvUpload}
              disabled={cvUploading}
              variant="outline"
            >
              <Upload className="size-4 mr-1" />
              {cvUploading ? "Upload..." : "Uploader"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <form onSubmit={handleSave}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Parametres d&apos;envoi et de relance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxEmails">Emails max par jour</Label>
              <Input
                id="maxEmails"
                type="number"
                value={settings.maxEmailsPerDay}
                onChange={(e) => updateSetting("maxEmailsPerDay", e.target.value)}
                min="1"
                max="100"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Limite quotidienne d&apos;envoi d&apos;emails
              </p>
            </div>

            <div className="flex items-center justify-between max-w-xs">
              <Label htmlFor="sendWeekends">Envoyer le week-end</Label>
              <Switch
                id="sendWeekends"
                checked={settings.sendOnWeekends === "true"}
                onCheckedChange={(checked) =>
                  updateSetting("sendOnWeekends", checked ? "true" : "false")
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpSpacing">
                Espacement des relances (jours)
              </Label>
              <Input
                id="followUpSpacing"
                value={settings.followUpSpacing}
                onChange={(e) => updateSetting("followUpSpacing", e.target.value)}
                placeholder="3,5,7"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Delais entre chaque relance, separes par des virgules
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFollowUps">Nombre max de relances</Label>
              <Input
                id="maxFollowUps"
                type="number"
                value={settings.maxFollowUps}
                onChange={(e) => updateSetting("maxFollowUps", e.target.value)}
                min="1"
                max="10"
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>Langue par defaut</Label>
              <Select
                value={settings.defaultLanguage}
                onValueChange={(v) => updateSetting("defaultLanguage", v as string)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Francais</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apolloKey">Cle API Apollo</Label>
              <Input
                id="apolloKey"
                type="password"
                value={settings.apolloApiKey}
                onChange={(e) => updateSetting("apolloApiKey", e.target.value)}
                placeholder="Votre cle API Apollo.io"
                className="max-w-xs"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <Button type="submit" disabled={saving}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
