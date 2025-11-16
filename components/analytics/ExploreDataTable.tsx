"use client";

import React, { useCallback, useMemo, useState } from "react";
import { DataGrid, DataGridContainer } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { DataGridTable } from "@/components/ui/data-grid-table";
import {
  createFilter,
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/ui/filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { formatNumber, formatPercentage } from "@/lib/analytics-api";

// Data interface for analytics explore data
interface AnalyticsRow {
  name: string; // dimension value (coalesce)
  clicks: number;
  unique_visitors: number;
  cpuv?: number; // clicks per unique visitor
  repeat_click_rate?: number;
  [key: string]: any;
}

interface ExploreDataTableProps {
  data: AnalyticsRow[];
  loading?: boolean;
}

export default function ExploreDataTable({
  data,
  loading = false,
}: ExploreDataTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "clicks", desc: true },
  ]);
  const [filters, setFilters] = useState<Filter[]>([]);

  // Check which metrics are available in the data
  const availableMetrics = useMemo(() => {
    if (data.length === 0) return { clicks: false, unique_visitors: false };
    const firstRow = data[0];
    return {
      clicks: firstRow.clicks !== undefined,
      unique_visitors: firstRow.unique_visitors !== undefined,
    };
  }, [data]);

  // Process data to include calculated columns
  const processedData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      cpuv:
        row.unique_visitors && row.unique_visitors !== 0
          ? row.clicks / row.unique_visitors
          : 0,
      repeat_click_rate:
        row.unique_visitors && row.clicks && row.clicks !== 0
          ? (row.clicks - row.unique_visitors) / row.clicks
          : 0,
    }));
  }, [data]);

  // Filter field configurations
  const fields: FilterFieldConfig[] = useMemo(() => {
    const flds: FilterFieldConfig[] = [
      {
        key: "name",
        label: "Dimension Value",
        icon: <span>📊</span>,
        type: "text",
        className: "w-40 bg-secondary",
        placeholder: "Search dimensions...",
      },
    ];

    if (availableMetrics.clicks) {
      flds.push({
        key: "clicks",
        label: "Clicks",
        icon: <span>👆</span>,
        type: "number",
        min: 0,
        max: 1000000,
        step: 1,
        operators: [
          { value: "is", label: "is" },
          { value: "is_not", label: "is not" },
          { value: "equals", label: "equals" },
          { value: "not_equals", label: "not equals" },
          { value: "greater_than", label: "greater than" },
          { value: "less_than", label: "less than" },
          { value: "greater_than_or_equal", label: "greater than or equal" },
          { value: "less_than_or_equal", label: "less than or equal" },
          { value: "between", label: "between" },
          { value: "not_between", label: "not between" },
        ],
        className: "w-32 bg-secondary",
      });
    }

    if (availableMetrics.unique_visitors) {
      flds.push({
        key: "unique_visitors",
        label: "Unique Visitors",
        icon: <span>👤</span>,
        type: "number",
        min: 0,
        max: 1000000,
        step: 1,
        operators: [
          { value: "is", label: "is" },
          { value: "is_not", label: "is not" },
          { value: "equals", label: "equals" },
          { value: "not_equals", label: "not equals" },
          { value: "greater_than", label: "greater than" },
          { value: "less_than", label: "less than" },
          { value: "greater_than_or_equal", label: "greater than or equal" },
          { value: "less_than_or_equal", label: "less than or equal" },
          { value: "between", label: "between" },
          { value: "not_between", label: "not between" },
        ],
        className: "w-32 bg-secondary",
      });
    }

    return flds;
  }, [availableMetrics]);

  // Apply filters to data
  const applyFiltersToData = useCallback(
    (newFilters: Filter[]) => {
      let filtered = [...processedData];

      // Filter out empty filters
      const activeFilters = newFilters.filter((filter) => {
        const { values } = filter;
        if (!values || values.length === 0) return false;
        if (
          values.every(
            (value) => typeof value === "string" && value.trim() === "",
          )
        )
          return false;
        if (values.every((value) => value === null || value === undefined))
          return false;
        if (values.every((value) => Array.isArray(value) && value.length === 0))
          return false;
        return true;
      });

      activeFilters.forEach((filter) => {
        const { field, operator, values } = filter;

        filtered = filtered.filter((item) => {
          const fieldValue = (item as any)[field];

          switch (operator) {
            case "contains":
              return String(fieldValue)
                .toLowerCase()
                .includes(String(values[0]).toLowerCase());
            case "not_contains":
              return !String(fieldValue)
                .toLowerCase()
                .includes(String(values[0]).toLowerCase());
            case "is":
            case "equals":
              return Number(fieldValue) === Number(values[0]);
            case "is_not":
            case "not_equals":
              return Number(fieldValue) !== Number(values[0]);
            case "greater_than":
              return Number(fieldValue) > Number(values[0]);
            case "less_than":
              return Number(fieldValue) < Number(values[0]);
            case "greater_than_or_equal":
              return Number(fieldValue) >= Number(values[0]);
            case "less_than_or_equal":
              return Number(fieldValue) <= Number(values[0]);
            case "between":
              if (values.length >= 2) {
                const min = Number(values[0]);
                const max = Number(values[1]);
                return Number(fieldValue) >= min && Number(fieldValue) <= max;
              }
              return true;
            case "not_between":
              if (values.length >= 2) {
                const min = Number(values[0]);
                const max = Number(values[1]);
                return Number(fieldValue) < min || Number(fieldValue) > max;
              }
              return true;
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [processedData],
  );

  const handleFiltersChange = useCallback((newFilters: Filter[]) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  // Column definitions
  const columns = useMemo<ColumnDef<AnalyticsRow>[]>(() => {
    const cols: ColumnDef<AnalyticsRow>[] = [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Dimension Value" column={column} />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
        size: 300,
        enableSorting: true,
        meta: {
          skeleton: <Skeleton className="h-4 w-40" />,
        },
      },
    ];

    // Only add clicks column if clicks metric is available
    if (availableMetrics.clicks) {
      cols.push({
        accessorKey: "clicks",
        header: ({ column }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DataGridColumnHeader title="C" column={column} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clicks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: ({ row }) => {
          const clicks = row.original.clicks;
          const formatted = formatNumber(clicks);
          return (
            <span
              className={`font-mono text-sm ${formatted === "—" ? "text-muted-foreground/30" : ""}`}
            >
              {formatted}
            </span>
          );
        },
        size: 120,
        enableSorting: true,
        meta: {
          skeleton: <Skeleton className="h-4 w-16" />,
        },
      });
    }

    // Only add unique_visitors column if unique_visitors metric is available
    if (availableMetrics.unique_visitors) {
      cols.push({
        accessorKey: "unique_visitors",
        header: ({ column }) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DataGridColumnHeader title="UV" column={column} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unique Visitors</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
        cell: ({ row }) => {
          const uv = row.original.unique_visitors;
          const formatted = formatNumber(uv);
          return (
            <span
              className={`font-mono text-sm text-right ${formatted === "—" ? "text-muted-foreground/30" : ""}`}
            >
              {formatted}
            </span>
          );
        },
        size: 140,
        enableSorting: true,
        meta: {
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      });
    }

    // Only add calculated columns if both metrics are available
    if (availableMetrics.clicks && availableMetrics.unique_visitors) {
      cols.push(
        {
          accessorKey: "cpuv",
          header: ({ column }) => (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DataGridColumnHeader title="CPUV" column={column} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clicks per Unique Visitor</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
          cell: ({ row }) => {
            const cpuv = row.original.cpuv;
            return cpuv !== undefined && cpuv !== 0 ? (
              <span className="font-mono text-sm text-right">
                {cpuv.toFixed(2)}
              </span>
            ) : (
              <span className="text-muted-foreground/30 text-right">—</span>
            );
          },
          size: 180,
          enableSorting: true,
          meta: {
            skeleton: <Skeleton className="h-4 w-24" />,
          },
        },
        {
          accessorKey: "repeat_click_rate",
          header: ({ column }) => (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DataGridColumnHeader title="RCR" column={column} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Repeat Click Rate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ),
          cell: ({ row }) => {
            const rate = row.original.repeat_click_rate;
            return rate !== undefined && rate !== 0 ? (
              <span className="font-mono text-sm text-right">
                {formatPercentage(rate)}
              </span>
            ) : (
              <span className="text-muted-foreground/30 text-right">—</span>
            );
          },
          size: 160,
          enableSorting: true,
          meta: {
            skeleton: <Skeleton className="h-4 w-20" />,
          },
        },
      );
    }

    return cols;
  }, [availableMetrics]);

  const filteredData = useMemo(
    () => applyFiltersToData(filters),
    [applyFiltersToData, filters],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full">
      {/* Filters Section */}
      <div className="flex items-start gap-2.5 mb-3.5">
        <div className="flex-1">
          <Filters
            filters={filters}
            fields={fields}
            onChange={handleFiltersChange}
            variant="outline"
            size="sm"
          />
        </div>
        {filters.length > 0 && (
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            onClick={() => setFilters([])}
          >
            <span>🗑️</span> Clear
          </button>
        )}
      </div>

      {/* Data Grid */}
      <DataGrid
        table={table}
        isLoading={loading}
        loadingMode="skeleton"
        recordCount={filteredData.length}
        tableLayout={{
          width: "auto",
          dense: true,
          columnsMovable: true,
          headerSticky: true,
          columnsResizable: true,
        }}
      >
        <div className="w-full space-y-2.5">
          <DataGridContainer>
            <ScrollArea className="max-h-96 overflow-hidden">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination />
        </div>
      </DataGrid>
    </div>
  );
}
