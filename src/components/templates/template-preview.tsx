"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplatePreviewProps {
  subject: string;
  body: string;
  open: boolean;
  onClose: () => void;
}

const SAMPLE_DATA: Record<string, string> = {
  "{firstName}": "Marc",
  "{lastName}": "Dupont",
  "{companyName}": "Tikehau Capital",
  "{role}": "Analyst Private Credit",
  "{city}": "Paris",
  "{senderName}": "Ousmane Thienta",
};

function renderWithVariables(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\{[a-zA-Z]+\})/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const variable = match[1];
    const replacement = SAMPLE_DATA[variable] || variable;
    parts.push(
      <span
        key={`${match.index}-${variable}`}
        className="bg-primary/10 text-primary px-1 rounded"
      >
        {replacement}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function TemplatePreview({
  subject,
  body,
  open,
  onClose,
}: TemplatePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apercu du template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
              Objet
            </p>
            <p className="text-sm font-medium">
              {renderWithVariables(subject)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
              Corps
            </p>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {renderWithVariables(body)}
            </div>
          </div>

          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Variables utilisees (donnees d&apos;exemple) :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(SAMPLE_DATA).map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {key} = {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
