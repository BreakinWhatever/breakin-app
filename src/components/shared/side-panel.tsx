"use client";

import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: React.ReactNode;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  onPrev?: () => void;
  onNext?: () => void;
  children: ReactNode;
}

export function SidePanel({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  onPrev,
  onNext,
  children,
}: SidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[520px] sm:max-w-[520px] flex flex-col p-0"
        showCloseButton
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="truncate">{title}</SheetTitle>
                  {badge && (
                    <Badge variant={badge.variant ?? "secondary"}>
                      {badge.label}
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <SheetDescription className="truncate">
                    {subtitle}
                  </SheetDescription>
                )}
              </div>
            </div>

            {(onPrev || onNext) && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onPrev}
                  disabled={!onPrev}
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onNext}
                  disabled={!onNext}
                  aria-label="Next"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4">{children}</div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
