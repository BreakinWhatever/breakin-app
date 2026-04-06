"use client";

import { useState, useCallback, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  Columns3,
  Check,
  Download,
  Trash2,
  Tags,
  AlignJustify,
  AlignCenter,
  AlignLeft,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Density types ---

type Density = "compact" | "comfortable" | "spacious";

const densityConfig: Record<Density, { cellPadding: string; icon: typeof AlignJustify }> = {
  compact: { cellPadding: "py-1 px-2 text-xs", icon: AlignJustify },
  comfortable: { cellPadding: "py-2 px-3 text-sm", icon: AlignCenter },
  spacious: { cellPadding: "py-3 px-4 text-sm", icon: AlignLeft },
};

// --- Bulk action types ---

export interface BulkAction<TData> {
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive" | "outline";
  onClick: (selectedRows: TData[]) => void | Promise<void>;
}

// --- Main component ---

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
  onRowClick?: (row: TData) => void;
  defaultPageSize?: number;
  enableSelection?: boolean;
  bulkActions?: BulkAction<TData>[];
  enableColumnVisibility?: boolean;
  enableDensity?: boolean;
  enableExport?: boolean;
  onExport?: (data: TData[], selectedOnly: boolean) => void;
  tableId?: string; // Used for persisting column visibility in localStorage
}

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  emptyState,
  onRowClick,
  defaultPageSize = 25,
  enableSelection = false,
  bulkActions = [],
  enableColumnVisibility = false,
  enableDensity = false,
  enableExport = false,
  onExport,
  tableId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      if (tableId && typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(`dt-vis-${tableId}`);
          if (saved) return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
      return {};
    }
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [density, setDensity] = useState<Density>("comfortable");

  // Persist column visibility
  const handleColumnVisibilityChange = useCallback(
    (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (tableId && typeof window !== "undefined") {
          localStorage.setItem(`dt-vis-${tableId}`, JSON.stringify(next));
        }
        return next;
      });
    },
    [tableId]
  );

  // Build columns with selection checkbox
  const allColumns: ColumnDef<TData, TValue>[] = enableSelection
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="size-4 rounded border-border accent-primary cursor-pointer"
              aria-label="Tout selectionner"
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              onClick={(e) => e.stopPropagation()}
              className="size-4 rounded border-border accent-primary cursor-pointer"
              aria-label="Selectionner la ligne"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          size: 40,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    enableMultiSort: true,
    onSortingChange: setSorting,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: enableSelection,
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  });

  // Selected rows
  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  // Page size
  const handlePageSizeChange = (value: string | null) => {
    if (!value) return;
    const size = Number(value);
    setPageSize(size);
    table.setPageSize(size);
  };

  // Export
  const handleExport = (selectedOnly: boolean) => {
    if (onExport) {
      onExport(selectedOnly ? selectedRows : data, selectedOnly);
    }
  };

  const dConfig = densityConfig[density];

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!loading && data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon ?? Inbox}
        title={emptyState.title}
        description={emptyState.description}
        actionLabel={emptyState.actionLabel}
        onAction={emptyState.onAction}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar: column visibility, density, export */}
      {(enableColumnVisibility || enableDensity || enableExport) && (
        <div className="flex items-center justify-end gap-2">
          {/* Column visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <Columns3 className="size-3.5 mr-1.5" />
                Colonnes
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      className="capitalize"
                    >
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Density */}
          {enableDensity && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <dConfig.icon className="size-3.5 mr-1.5" />
                Densite
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={density === "compact"}
                  onCheckedChange={() => setDensity("compact")}
                >
                  Compact
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={density === "comfortable"}
                  onCheckedChange={() => setDensity("comfortable")}
                >
                  Confortable
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={density === "spacious"}
                  onCheckedChange={() => setDensity("spacious")}
                >
                  Spacieux
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          {enableExport && onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <Download className="size-3.5 mr-1.5" />
                Exporter
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={false}
                  onCheckedChange={() => handleExport(false)}
                >
                  Exporter tout ({data.length})
                </DropdownMenuCheckboxItem>
                {hasSelection && (
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => handleExport(true)}
                  >
                    Exporter la selection ({selectedRows.length})
                  </DropdownMenuCheckboxItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Bulk actions bar */}
      {hasSelection && bulkActions.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-2.5">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedRows.length} selectionne{selectedRows.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            {bulkActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Button
                  key={i}
                  variant={action.variant ?? "outline"}
                  size="sm"
                  onClick={() => action.onClick(selectedRows)}
                >
                  {Icon && <Icon className="size-3.5 mr-1" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              Deselectionner
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={dConfig.cellPadding}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={(e) => {
                        // Support multi-sort with shift key
                        header.column.getToggleSortingHandler()?.(e);
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <ArrowUpDown className="size-3.5 text-muted-foreground" />
                    </button>
                  ) : (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                onRowClick && "cursor-pointer",
                row.getIsSelected() && "bg-muted/50"
              )}
              onClick={() => onRowClick?.(row.original)}
              data-state={row.getIsSelected() ? "selected" : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={dConfig.cellPadding}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {enableSelection && hasSelection ? (
            <>
              {selectedRows.length} sur{" "}
            </>
          ) : null}
          {table.getFilteredRowModel().rows.length} resultat
          {table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Par page</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Page precedente</span>
              &lsaquo;
            </Button>
            <span className="mx-1 text-xs">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Page suivante</span>
              &rsaquo;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
