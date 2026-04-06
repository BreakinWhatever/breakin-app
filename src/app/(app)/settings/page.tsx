"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Upload, Trash2, Mail, Phone, Globe } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // CV data from settings
  const [cvData, setCvData] = useState<{
    fr?: { firstName: string; lastName: string; email: string; phone: string; location: string; cvFile: string };
    en?: { firstName: string; lastName: string; email: string; phone: string; location: string; cvFile: string };
    education?: { school: string; degree: string; dates: string; location: string }[];
    experience?: { company: string; role: string; team?: string; aum?: string; dates: string; location: string }[];
    skills?: string[];
    languages?: string[];
  } | null>(null);

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

    // Fetch CV data from settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.cvData) {
          try {
            setCvData(JSON.parse(data.cvData));
          } catch {
            // ignore parse errors
          }
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

      {/* CV Profiles Section */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Profils Candidature</CardTitle>
          <CardDescription>
            Deux profils : FR pour les candidatures en France, EN pour les candidatures internationales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cvData ? (
            <Tabs defaultValue="fr">
              <TabsList className="mb-4">
                <TabsTrigger value="fr">
                  Candidatures (FR)
                </TabsTrigger>
                <TabsTrigger value="en">
                  Applications (EN)
                </TabsTrigger>
              </TabsList>

              {(["fr", "en"] as const).map((lang) => {
                const profile = cvData[lang];
                if (!profile) return null;
                return (
                  <TabsContent key={lang} value={lang} className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">
                          {profile.firstName} {profile.lastName}
                        </h3>
                        <Badge variant={lang === "fr" ? "default" : "secondary"}>
                          {lang === "fr" ? "Francais" : "English"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-3.5" />
                          <span>{profile.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="size-3.5" />
                          <span>{profile.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="size-3.5" />
                          <span>{profile.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <FileText className="size-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">{profile.cvFile}</span>
                      </div>
                    </div>

                    {/* Education */}
                    {cvData.education && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Formation
                        </h4>
                        {cvData.education.map((edu, i) => (
                          <div key={i} className="text-sm space-y-0.5">
                            <div className="font-medium">{edu.school}</div>
                            <div className="text-muted-foreground">{edu.degree}</div>
                            <div className="text-xs text-muted-foreground">{edu.dates} — {edu.location}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Experience */}
                    {cvData.experience && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Experience
                        </h4>
                        {cvData.experience.map((exp, i) => (
                          <div key={i} className="text-sm space-y-0.5">
                            <div className="font-medium">{exp.company}</div>
                            <div className="text-muted-foreground">{exp.role}</div>
                            <div className="text-xs text-muted-foreground">{exp.dates} — {exp.location}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skills */}
                    {cvData.skills && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Competences
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {cvData.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-6">
              Aucun CV configure. Uploadez vos CVs pour commencer.
            </div>
          )}

          {/* Upload */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <Label>Mettre a jour un CV</Label>
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
