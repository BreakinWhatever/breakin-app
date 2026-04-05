"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    period: string;
  };
}

export function MetricsCard({ label, value, trend }: MetricsCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                isPositive && "text-emerald-600 dark:text-emerald-400",
                isNegative && "text-red-600 dark:text-red-400",
                !isPositive && !isNegative && "text-muted-foreground"
              )}
            >
              {isPositive && <ArrowUpRight className="size-3.5" />}
              {isNegative && <ArrowDownRight className="size-3.5" />}
              {!isPositive && !isNegative && <Minus className="size-3.5" />}
              <span>
                {isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-muted-foreground ml-0.5">
                {trend.period}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
