"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Building2, MapPin, Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  priority: number;
}

interface CompanyDetail {
  id: string;
  name: string;
  sector: string;
  size: string;
  city: string;
  country: string;
  website: string | null;
  notes: string | null;
  contacts: Contact[];
}

export default function CompanyDetailPage() {
  const params = useParams();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/companies/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setCompany(null);
        } else {
          setCompany(data);
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

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Entreprise introuvable</p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4 mr-1" />
            Retour aux entreprises
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/companies">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-3.5 mr-1" />
            Entreprises
          </Button>
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{company.name}</span>
      </div>

      <PageHeader title={company.name} description={company.sector} />

      {/* Info card */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                Ville
              </div>
              <p className="text-sm font-medium">{company.city}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                Pays
              </div>
              <p className="text-sm font-medium">{company.country}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3" />
                Taille
              </div>
              <p className="text-sm font-medium">{company.size || "-"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-3" />
                Site web
              </div>
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline block truncate"
                >
                  {company.website}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>

          {company.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                Notes
              </p>
              <p className="text-sm">{company.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4" />
            Contacts ({company.contacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun contact dans cette entreprise
            </p>
          ) : (
            <div className="space-y-2">
              {company.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors block"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {c.email}
                    </span>
                    <Badge variant="outline">P{c.priority}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
