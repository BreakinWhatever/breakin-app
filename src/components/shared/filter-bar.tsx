"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
}: FilterBarProps) {
  const hasActiveFilters =
    search.length > 0 || Object.values(activeFilters).some((v) => v !== "");

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative max-w-xs flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
        />
      </div>

      {/* Filter dropdowns */}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={activeFilters[filter.key] ?? ""}
          onValueChange={(value) => onFilterChange(filter.key, value as string)}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="size-3.5 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  );
}
