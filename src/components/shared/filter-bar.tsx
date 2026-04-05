"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Save, Clock, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export interface FilterConfig {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface QuickFilter {
  label: string;
  filters: Record<string, string>;
}

export interface DateRangeConfig {
  key: string;
  label: string;
}

interface SavedPreset {
  name: string;
  filters: Record<string, string>;
  search: string;
  dateRange?: { from: string; to: string };
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  // New features
  quickFilters?: QuickFilter[];
  onQuickFilter?: (filters: Record<string, string>) => void;
  dateRange?: DateRangeConfig;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  presetStorageKey?: string; // localStorage key for saved presets
}

// --- Date range helpers ---

function getRelativeDateFrom(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
  quickFilters = [],
  onQuickFilter,
  dateRange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  presetStorageKey,
}: FilterBarProps) {
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showSavePopover, setShowSavePopover] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    if (!presetStorageKey) return;
    try {
      const saved = localStorage.getItem(`filter-presets-${presetStorageKey}`);
      if (saved) setSavedPresets(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [presetStorageKey]);

  // Save presets to localStorage
  const persistPresets = useCallback(
    (presets: SavedPreset[]) => {
      if (!presetStorageKey) return;
      localStorage.setItem(
        `filter-presets-${presetStorageKey}`,
        JSON.stringify(presets)
      );
      setSavedPresets(presets);
    },
    [presetStorageKey]
  );

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const preset: SavedPreset = {
      name: presetName.trim(),
      filters: { ...activeFilters },
      search,
      dateRange:
        dateFrom && dateTo ? { from: dateFrom, to: dateTo } : undefined,
    };
    const updated = [...savedPresets.filter((p) => p.name !== preset.name), preset];
    persistPresets(updated);
    setPresetName("");
    setShowSavePopover(false);
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    onSearchChange(preset.search);
    for (const [key, value] of Object.entries(preset.filters)) {
      onFilterChange(key, value);
    }
    if (preset.dateRange) {
      onDateFromChange?.(preset.dateRange.from);
      onDateToChange?.(preset.dateRange.to);
    }
  };

  const handleDeletePreset = (name: string) => {
    const updated = savedPresets.filter((p) => p.name !== name);
    persistPresets(updated);
  };

  const handleQuickDateRange = (days: number) => {
    onDateFromChange?.(getRelativeDateFrom(days));
    onDateToChange?.(getToday());
  };

  const hasActiveFilters =
    search.length > 0 ||
    Object.values(activeFilters).some((v) => v !== "") ||
    (dateFrom && dateFrom.length > 0) ||
    (dateTo && dateTo.length > 0);

  const activeFilterCount =
    Object.values(activeFilters).filter((v) => v !== "").length +
    (dateFrom ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="space-y-2">
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
            onValueChange={(value) =>
              onFilterChange(filter.key, value as string)
            }
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

        {/* Date range filter */}
        {dateRange && onDateFromChange && onDateToChange && (
          <Popover>
            <PopoverTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Clock className="size-3.5 mr-1.5" />
              {dateFrom
                ? `${dateFrom} — ${dateTo || "..."}`
                : dateRange.label}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto space-y-3">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Du</p>
                  <Input
                    type="date"
                    value={dateFrom || ""}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Au</p>
                  <Input
                    type="date"
                    value={dateTo || ""}
                    onChange={(e) => onDateToChange(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(7)}
                >
                  7 jours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(30)}
                >
                  30 jours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateRange(90)}
                >
                  90 jours
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Quick filters */}
        {quickFilters.length > 0 && onQuickFilter && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Filter className="size-3.5 mr-1.5" />
              Filtres rapides
              <ChevronDown className="size-3 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {quickFilters.map((qf, i) => (
                <DropdownMenuItem key={i} onClick={() => onQuickFilter(qf.filters)}>
                  {qf.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Saved presets */}
        {presetStorageKey && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Save className="size-3.5 mr-1.5" />
              Presets
              {savedPresets.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {savedPresets.length}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {savedPresets.length > 0 && (
                <>
                  <DropdownMenuLabel>Presets sauvegardes</DropdownMenuLabel>
                  {savedPresets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.name}
                      className="flex items-center justify-between"
                    >
                      <span
                        onClick={() => handleLoadPreset(preset)}
                        className="flex-1 cursor-pointer"
                      >
                        {preset.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.name);
                        }}
                        className="text-muted-foreground hover:text-destructive ml-2"
                      >
                        <X className="size-3" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              <div className="p-2">
                <Popover open={showSavePopover} onOpenChange={setShowSavePopover}>
                  <PopoverTrigger
                    render={<Button variant="outline" size="sm" className="w-full" />}
                  >
                    <Save className="size-3.5 mr-1" />
                    Sauvegarder les filtres actuels
                  </PopoverTrigger>
                  <PopoverContent className="w-64 space-y-2">
                    <p className="text-sm font-medium">Nom du preset</p>
                    <Input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Ex: Priorite haute"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSavePreset();
                      }}
                    />
                    <Button size="sm" onClick={handleSavePreset} className="w-full">
                      Sauvegarder
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="size-3.5 mr-1" />
            Effacer
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
