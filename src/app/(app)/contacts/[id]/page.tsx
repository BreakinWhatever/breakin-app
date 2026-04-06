"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Email {
  id: string;
  type: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface Outreach {
  id: string;
  status: string;
  campaignId: string;
  lastContactDate: string | null;
  emails: Email[];
}

interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  linkedinUrl: string | null;
  priority: number;
  source: string;
  notes: string | null;
  company: {
    id: string;
    name: string;
    sector: string;
    city: string;
  };
  outreaches: Outreach[];
}

const priorityConfig: Record<
  number,
  { variant: "destructive" | "default" | "secondary" | "outline"; className?: string }
> = {
  1: { variant: "destructive" },
  2: { variant: "default", className: "bg-orange-500/10 text-orange-600 border-transparent dark:text-orange-400" },
  3: { variant: "default", className: "bg-yellow-500/10 text-yellow-600 border-transparent dark:text-yellow-400" },
  4: { variant: "default", className: "bg-blue-500/10 text-blue-600 border-transparent dark:text-blue-400" },
  5: { variant: "secondary" },
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuve",
  sent: "Envoye",
  ignored: "Ignore",
};

const emailStatusVariants: Record<string, "default" | "secondary" | "outline"> = {
  sent: "default",
  draft: "secondary",
  approved: "outline",
  ignored: "outline",
};

export default function ContactDetailPage() {
  const params = useParams();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/contacts/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setContact(null);
        } else {
          setContact(data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Contact introuvable</p>
        <Link href="/contacts">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4 mr-1" />
            Retour aux contacts
          </Button>
        </Link>
      </div>
    );
  }

  const allEmails = contact.outreaches.flatMap((o) =>
    o.emails.map((e) => ({ ...e, outreachStatus: o.status }))
  );
  allEmails.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pConfig = priorityConfig[contact.priority] || priorityConfig[5];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-3.5 mr-1" />
            Contacts
          </Button>
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {contact.firstName} {contact.lastName}
        </span>
      </div>

      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={contact.title}
        actions={
          <Badge variant={pConfig.variant} className={pConfig.className}>
            P{contact.priority}
          </Badge>
        }
      />

      {/* Info card */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Email
              </p>
              <p className="text-sm">{contact.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Entreprise
              </p>
              <Link
                href={`/companies/${contact.company.id}`}
                className="text-sm text-primary hover:underline block"
              >
                {contact.company.name}
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                Source
              </p>
              <p className="text-sm capitalize">{contact.source}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                LinkedIn
              </p>
              {contact.linkedinUrl ? (
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block truncate"
                >
                  Profil LinkedIn
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>

          {contact.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Notes
              </p>
              <p className="text-sm">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des emails</CardTitle>
        </CardHeader>
        <CardContent>
          {allEmails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun email envoye
            </p>
          ) : (
            <div className="space-y-3">
              {allEmails.map((email) => (
                <div
                  key={email.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {email.type}
                      </Badge>
                      <Badge
                        variant={emailStatusVariants[email.status] ?? "outline"}
                      >
                        {statusLabels[email.status] || email.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(email.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {email.subject}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
                    {email.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
