import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

// --- Custom Node Components ---
const PeriodNode = ({ data }: any) => (
  <div className="font-mono py-4 bg-muted dark:bg-muted border-2 border-muted-foreground dark:border-muted-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-[220px]">
    <div className="px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-1">
      Period
    </div>
    <Separator
      orientation={"horizontal"}
      className=" my-2 bg-muted-foreground opacity-50"
    />
    <div className="px-4">
      <div className="text-slate-900 dark:text-slate-100 text-lg font-bold">
        <span className="">{data.value}</span>
      </div>
      <div className="text-slate-600 dark:text-slate-400 text-xs mt-1">
        {data.resultCount?.toLocaleString()} visits
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  </div>
);

const MetricsNode = ({ data }: any) => (
  <div className="font-mono py-4 bg-muted dark:bg-muted border-2 border-muted-foreground dark:border-muted-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-[220px]">
    <Handle type="target" position={Position.Top} />
    <div className="px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-1">
      Metrics
    </div>
    <Separator
      orientation={"horizontal"}
      className="my-2 bg-muted-foreground opacity-50"
    />
    <div className="px-4">
      <div className="text-slate-900 dark:text-slate-100 text-base font-bold">
        <span className="">{data.count}</span> selected
      </div>
      <div className="text-slate-700 dark:text-slate-300 text-xs mt-1 flex flex-wrap gap-1">
        {data.items?.map((item: string, idx: number) => (
          <span
            key={idx}
            className="font-mono bg-muted dark:bg-muted-foreground/20 text-popover-foreground px-1.5 py-0.5 rounded text-[10px] font-medium"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="text-slate-600 dark:text-slate-400 text-xs mt-1">
        {data.resultCount?.toLocaleString()} visits
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  </div>
);

const DimensionsNode = ({ data }: any) => (
  <div className="font-mono py-4 bg-muted dark:bg-muted border-2 border-muted-foreground dark:border-muted-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-[220px]">
    <Handle type="target" position={Position.Top} />
    <div className="px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-1">
      Dimensions
    </div>
    <Separator
      orientation={"horizontal"}
      className="my-2 bg-muted-foreground opacity-50"
    />
    <div className="px-4">
      <div className="text-slate-900 dark:text-slate-100 text-base font-bold mb-2">
        <span className="font-mono">{data.count}</span> selected
      </div>
      <div className="space-y-1">
        {data.items?.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-slate-800 dark:text-slate-200 font-medium">
              {item.label}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                item.type === "context"
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  : "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300"
              }`}
            >
              {item.type.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  </div>
);

const ContextNode = ({ data }: any) => {
  // Format distinct values label
  const distinctValuesLabel = formatDistinctValuesLabel(
    data.label,
    data.type,
    data.distinctValues,
    data.value,
  );

  return (
    <div className="font-mono py-4 bg-white dark:bg-slate-800 border-2 border-emerald-500 dark:border-emerald-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-[190px]">
      <Handle type="target" position={Position.Top} />
      <div className="px-4 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wide mb-1">
        {data.label.replace(/\(context\)|context/gi, "").trim()}
      </div>
      <Separator
        orientation={"horizontal"}
        className="my-2 bg-emerald-500 opacity-50"
      />
      <div className="px-4">
        <div className="text-slate-900 dark:text-slate-100 text-sm font-semibold mb-1 truncate">
          {data.value}
        </div>
        <div className="text-slate-600 dark:text-slate-400 text-xs">
          {data.resultCount?.toLocaleString()} visits
        </div>
        <div className="text-slate-500 dark:text-slate-500 text-xs">
          {distinctValuesLabel}
        </div>
        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  );
};

const DrilldownNode = ({ data }: any) => {
  // Format distinct values label
  const distinctValuesLabel = formatDistinctValuesLabel(
    data.label,
    data.type,
    data.distinctValues,
    data.value,
  );

  return (
    <div className="font-mono py-4 bg-white dark:bg-slate-800 border-2 border-orange-500 dark:border-orange-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-[190px]">
      <Handle type="target" position={Position.Top} />
      <div className="px-4 text-orange-600 dark:text-orange-400 font-semibold text-xs uppercase tracking-wide mb-1">
        {data.label}
      </div>
      <Separator
        orientation={"horizontal"}
        className="my-2 bg-orange-500 opacity-50"
      />
      <div className="px-4">
        <div className="text-slate-900 dark:text-slate-100 text-sm font-semibold mb-1 truncate">
          {data.value}
        </div>
        <div className="text-slate-600 dark:text-slate-400 text-xs">
          {data.resultCount?.toLocaleString()} visits
        </div>
        <div className="text-slate-500 dark:text-slate-500 text-xs">
          {distinctValuesLabel}
        </div>
        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  );
};

const GroupNode = ({ data }: any) => (
  <div
    className={`rounded-lg border ${
      data.type === "context"
        ? "bg-emerald-50/30 dark:bg-green-950/20 border-emerald-300 dark:border-emerald-700"
        : "bg-orange-50/30 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700"
    }`}
    style={{
      width: "100%",
      height: "100%",
      padding: "10px",
      position: "relative",
    }}
  >
    {/* Handles for edge connections */}
    <Handle type="target" position={Position.Top} id="top" />
    <Handle type="target" position={Position.Bottom} id="bottom" />
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="target" position={Position.Right} id="right" />
    <Handle type="source" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="source" position={Position.Left} id="left" />
    <Handle type="source" position={Position.Right} id="right" />

    <div
      className={`text-xs font-semibold uppercase tracking-wider ${
        data.type === "context"
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-orange-700 dark:text-orange-400"
      }`}
    >
      {data.label}
    </div>
  </div>
);

// Helper function to determine if dimension is context type
const isContextDimension = (
  dimensionValue: string,
  dimensionLabel: string,
): boolean => {
  const value = dimensionValue.toLowerCase();
  const label = dimensionLabel.toLowerCase();

  if (label.includes("(context)") || label.includes("context")) {
    return true;
  }

  const contextDimensions = ["campaign", "link", "group", "tag"];
  if (contextDimensions.includes(value)) {
    return true;
  }

  if (value.startsWith("utm_")) {
    return true;
  }

  return false;
};

// Helper function to format distinct values label
const formatDistinctValuesLabel = (
  dimensionLabel: string,
  dimensionType: string,
  distinctValues: number,
  filterValue: string,
): string => {
  // Clean dimension name by removing "(context)" tag if present
  const cleanDimensionName = dimensionLabel
    .replace(/\(context\)|context/gi, "")
    .trim();

  // Check if this is a default "All ..." value
  if (filterValue.startsWith("All ")) {
    // Format: "<count> available <dimension name>"
    const lowerName = cleanDimensionName.toLowerCase();
    let pluralName = lowerName;

    // Handle pluralization
    if (distinctValues !== 1) {
      // Special case for words ending with 'y' (country -> countries, city -> cities)
      if (
        lowerName.endsWith("y") &&
        !["day", "way", "play"].includes(lowerName)
      ) {
        pluralName = lowerName.slice(0, -1) + "ies";
      }
      // General case: add 's'
      else {
        pluralName = lowerName + "s";
      }
    }

    return `${distinctValues} available ${pluralName}`;
  } else {
    // Format: "from <selected value from filter>"
    return `from ${filterValue}`;
  }
};

// --- Main Component ---
export default function AnalyticsFiltersFlow({
  selectedPeriod = "30d",
  selectedMetrics = ["Clicks", "Unique Visitors"],
  selectedDimensions = [
    { value: "device_type", label: "Device", type: "drilldown" },
    { value: "browser_name", label: "Browser", type: "drilldown" },
    { value: "campaign", label: "Campaign", type: "context" },
  ],
  filters = {
    campaign: "Summer Sale",
    device_type: "Mobile",
    browser_name: "All browsers",
  },
  exploreData, // Add exploreData prop to receive API response
}: any) {
  const initialData = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Calculate result counts from exploreData if available
    let totalCount = 0;
    let contextCount = 0;
    let drilldownCount = 0;

    // Helper function to calculate dimension statistics following PageClient's filtering logic
    const calculateDimensionStats = (
      data: any[],
      dimension: string,
      filters: any = {},
    ) => {
      if (!data || !data.length) return { count: 0, uniqueValues: 0, total: 0 };

      // Apply the same filtering logic as PageClient
      const filteredData = data.filter((item) => {
        if (
          !item.coalesce ||
          item.coalesce.includes("Unknown") ||
          item.coalesce.includes("No Campaign")
        ) {
          return false;
        }

        // Check campaign filter (context filter)
        if (
          filters.campaign !== undefined &&
          item.campaign !== filters.campaign
        ) {
          return false;
        }

        // Check link filter (context filter)
        if (filters.link !== undefined && item.link !== filters.link) {
          return false;
        }

        // Check group filter (context filter)
        if (filters.group !== undefined && item.group !== filters.group) {
          return false;
        }

        // Check tag filter (context filter)
        if (filters.tag !== undefined && item.tag !== filters.tag) {
          return false;
        }

        // Check other filters (UTM and other dimensions)
        for (const key in filters) {
          if (
            key !== "campaign" &&
            key !== "link" &&
            key !== "group" &&
            key !== "tag" &&
            key !== "start_date" &&
            key !== "end_date" &&
            key !== "include_timeseries" &&
            key !== "interval" &&
            filters[key] !== undefined &&
            item[key] !== filters[key]
          ) {
            return false;
          }
        }

        return true;
      });

      const values = new Set<string>();
      let total = 0;

      filteredData.forEach((item) => {
        const value = item[dimension];
        if (value !== undefined && value !== null) {
          values.add(String(value));
          // Sum up the primary metric (clicks if available, otherwise unique_visitors)
          const metricValue = item.clicks || item.unique_visitors || 0;
          total += metricValue;
        }
      });

      return {
        count: values.size,
        total: total,
        uniqueValues: values.size,
      };
    };

    // Process exploreData if available
    if (exploreData?.data && Array.isArray(exploreData.data)) {
      // Calculate total count from all data points
      totalCount = exploreData.data.reduce((sum: number, item: any) => {
        return sum + (item.clicks || item.unique_visitors || 0);
      }, 0);

      // Calculate context and drilldown counts based on selected dimensions
      const contextDims = selectedDimensions.filter(
        (d: any) =>
          d.type === "context" ||
          (typeof d === "string" && isContextDimension(d, d)),
      );

      const drilldownDims = selectedDimensions.filter(
        (d: any) =>
          d.type === "drilldown" ||
          (typeof d === "string" && !isContextDimension(d, d)),
      );

      // Calculate context count (sum of context dimension values)
      if (contextDims.length > 0) {
        contextCount = contextDims.reduce((sum: number, dim: any) => {
          const dimValue = typeof dim === "string" ? dim : dim.value;
          const stats = calculateDimensionStats(exploreData.data, dimValue);
          return sum + (stats.total || 0);
        }, 0);
      }

      // Calculate drilldown count (sum of drilldown dimension values)
      if (drilldownDims.length > 0) {
        drilldownCount = drilldownDims.reduce((sum: number, dim: any) => {
          const dimValue = typeof dim === "string" ? dim : dim.value;
          const stats = calculateDimensionStats(exploreData.data, dimValue);
          return sum + (stats.total || 0);
        }, 0);
      }
    } else {
      // Fallback to default values if no exploreData
      totalCount = exploreData?.total_count || 0;
      contextCount = totalCount * 0.3; // 30% for context
      drilldownCount = totalCount * 0.7; // 70% for drilldown
    }

    const dimensions = Array.isArray(selectedDimensions)
      ? selectedDimensions.map((d) => {
          if (typeof d === "string") {
            const isContext = isContextDimension(d, d);
            return {
              value: d,
              label: d,
              type: isContext ? "context" : "drilldown",
            };
          }

          const value = d.value || d.label || "";
          const label = d.label || d.value || "";
          let type = d.type;

          if (!type || (type !== "context" && type !== "drilldown")) {
            type = isContextDimension(value, label) ? "context" : "drilldown";
          }

          return { value, label, type };
        })
      : [];

    const metrics = Array.isArray(selectedMetrics)
      ? selectedMetrics.map((m) =>
          typeof m === "string" ? m : m.label || m.value || "",
        )
      : [];

    // Level 1: Period (centered at top)
    nodes.push({
      id: "period",
      type: "period",
      data: { label: "Period", value: selectedPeriod, resultCount: totalCount },
      position: { x: 490, y: 50 },
    });

    // Level 2: Metrics
    nodes.push({
      id: "metrics",
      type: "metrics",
      data: {
        label: "Metrics",
        count: metrics.length,
        items: metrics,
        resultCount: totalCount,
      },
      position: { x: 490, y: 220 },
    });

    edges.push({
      id: "e-period-metrics",
      source: "period",
      target: "metrics",
      type: "smoothstep",
      animated: true,
      style: { strokeWidth: 2, stroke: "#a3a3a3" },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#a3a3a3" },
    });

    // Level 3: Dimensions
    if (dimensions.length > 0) {
      nodes.push({
        id: "dimensions",
        type: "dimensions",
        data: {
          label: "Dimensions",
          count: dimensions.length,
          items: dimensions,
          resultCount: totalCount,
        },
        position: { x: 770, y: 100 },
      });

      edges.push({
        id: "e-metrics-dimensions",
        source: "metrics",
        target: "dimensions",
        type: "smoothstep",
        animated: true,
        style: { strokeWidth: 2, stroke: "#a3a3a3" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a3a3a3" },
      });

      const contextDims = dimensions.filter((d) => d.type === "context");
      const drilldownDims = dimensions.filter((d) => d.type === "drilldown");

      // Context Filters - Better spacing
      if (contextDims.length > 0) {
        const nodeWidth = 190;
        const nodeGap = 40; // Increased from 20
        const totalWidth =
          contextDims.length * nodeWidth + (contextDims.length - 1) * nodeGap;
        const dimensionsCenterX = 770 + 110; // Dimensions node center (770 + 220/2)
        const parentX = dimensionsCenterX - (totalWidth + 80) / 2; // Center context parent handle at dimensions center
        const parentY = 450; // Position context parent with better vertical spacing

        // Create parent node for Context level
        const contextParentId = "context-parent";
        nodes.push({
          id: contextParentId,
          type: "group",
          data: {
            label: "Context",
            type: "context",
          },
          position: { x: parentX, y: parentY },
          style: {
            width: totalWidth + 80, // Add padding around context nodes
            height: 260, // Increased height for better vertical spacing
            //backgroundColor: "rgba(240,240,240,0.25)",
            //backgroundColor: "rgba(240, 240, 240, 0.14)",
            //border: "2px dashed  #10b981", // Green border for context
            border: "1px dashed #10b981",
            borderRadius: "12px",
            padding: "30px",
          },
        });

        // Add edge from dimensions to context parent (Bottom --> Top)
        edges.push({
          id: `e-dimensions-${contextParentId}`,
          source: "dimensions",
          target: contextParentId,
          type: "smoothstep",
          animated: true,
          style: { strokeWidth: 2, stroke: "#10b981" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
          sourceHandle: "bottom",
          targetHandle: "top",
        });

        // Create individual context nodes with positions relative to parent
        contextDims.forEach((dim, idx) => {
          const nodeId = `context-${dim.value}`;
          const dimValue = typeof dim === "string" ? dim : dim.value;

          // Calculate specific result count using the refactored function that follows PageClient's filtering logic
          let specificResultCount = contextCount - idx * 10; // Default fallback
          let distinctValues = 0;

          if (exploreData?.data && Array.isArray(exploreData.data)) {
            // Use the refactored function that applies all filters consistently
            const stats = calculateDimensionStats(
              exploreData.data,
              dimValue,
              filters,
            );
            specificResultCount = stats.total || 0;
            distinctValues = stats.uniqueValues || 0;
          }

          nodes.push({
            id: nodeId,
            type: "context",
            data: {
              label: dim.label,
              value: filters[dim.value] || `All ${dim.label.toLowerCase()}`,
              resultCount: Math.max(0, Math.round(specificResultCount)),
              distinctValues: distinctValues,
            },
            position: { x: idx * (nodeWidth + nodeGap) + 40, y: 80 }, // Relative to parent
            parentNode: contextParentId, // Set parent relationship
            extent: "parent",
          });
          // Removed individual edges from dimensions to context children
        });

        // Add cross-filter edges between context nodes when >1 node exists
        if (contextDims.length > 1) {
          for (let i = 0; i < contextDims.length - 1; i++) {
            const sourceNodeId = `context-${contextDims[i].value}`;
            const targetNodeId = `context-${contextDims[i + 1].value}`;

            // Bi-directional edge (A <-> B)
            const edgeId = `e-cross-context-${sourceNodeId}-${targetNodeId}`;
            edges.push({
              id: edgeId,
              source: sourceNodeId,
              target: targetNodeId,
              type: "bezier",
              animated: true,
              style: {
                strokeWidth: 1,
                stroke: "#10b981",
                strokeDasharray: "5 5",
                //opacity: 0.7
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#10b981",
              },
              label: "Cross Filter",
              labelStyle: {
                //fill: '#6366f1',
                fontWeight: 500,
                fontSize: 10,
              },
              labelShowBg: true,
              labelBgStyle: {
                //fill: 'white',
                stroke: "#10b981",
                strokeWidth: 1,
              },
            });

            // Reverse edge for bi-directional appearance (B <-> A)
            const reverseEdgeId = `e-cross-context-${targetNodeId}-${sourceNodeId}-reverse`;
            edges.push({
              id: reverseEdgeId,
              source: targetNodeId,
              target: sourceNodeId,
              type: "bezier",
              animated: true,
              style: {
                strokeWidth: 1,
                stroke: "#b1b1b7",
                strokeDasharray: "5 5",
                //opacity: 0.7
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#10b981",
              },
            });
          }
        }
      }

      // Drilldown Filters - Better spacing
      if (drilldownDims.length > 0) {
        const nodeWidth = 190;
        const nodeGap = 40; // Increased from 20
        const totalWidth =
          drilldownDims.length * nodeWidth +
          (drilldownDims.length - 1) * nodeGap;
        const dimensionsCenterX = 770 + 110; // Dimensions node center (770 + 220/2)
        const parentX = dimensionsCenterX - (totalWidth + 80) / 2; // Center drilldown parent handle at dimensions center
        const parentY = contextDims.length > 0 ? 750 : 500; // Increased spacing between context and drilldown boxes

        // Create parent node for Drilldown level
        const drilldownParentId = "drilldown-parent";
        nodes.push({
          id: drilldownParentId,
          type: "group",
          data: {
            label: "Drilldown",
            type: "drilldown",
          },
          position: { x: parentX, y: parentY },
          style: {
            width: totalWidth + 80, // Add padding around drilldown nodes
            height: 260, // Increased height for better vertical spacing
            //backgroundColor: "rgba(240, 240, 240, 0.14)",
            border: "1px dashed #f59e0b",
            borderRadius: "12px",
            padding: "30px",
          },
        });

        // Add edge from dimensions to drilldown parent (Right --> Right)
        edges.push({
          id: `e-dimensions-${drilldownParentId}`,
          source: "dimensions",
          target: drilldownParentId,
          type: "smoothstep",
          animated: true,
          style: { strokeWidth: 2, stroke: "#f59e0b" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
          sourceHandle: "right",
          targetHandle: "right",
        });

        // Create individual drilldown nodes with positions relative to parent (0,0 origin)
        drilldownDims.forEach((dim, idx) => {
          const nodeId = `drilldown-${dim.value}`;
          const dimValue = typeof dim === "string" ? dim : dim.value;

          // Calculate specific result count using the refactored function that follows PageClient's filtering logic
          let specificResultCount = drilldownCount - idx * 50; // Default fallback
          let distinctValues = 0;

          if (exploreData?.data && Array.isArray(exploreData.data)) {
            // Use the refactored function that applies all filters consistently
            const stats = calculateDimensionStats(
              exploreData.data,
              dimValue,
              filters,
            );
            specificResultCount = stats.total || 0;
            distinctValues = stats.uniqueValues || 0;
          }

          nodes.push({
            id: nodeId,
            type: "drilldown",
            data: {
              label: dim.label,
              value: filters[dim.value] || `All ${dim.label.toLowerCase()}`,
              resultCount: Math.max(0, Math.round(specificResultCount)),
              distinctValues: distinctValues,
            },
            position: { x: idx * (nodeWidth + nodeGap) + 40, y: 80 }, // Position relative to parent (0,0)
            parentNode: drilldownParentId, // Set parent relationship
            extent: "parent",
          });

          // Removed individual edges from dimensions to drilldown children
        });

        // Add cross-filter edges between drilldown nodes when >1 node exists
        if (drilldownDims.length > 1) {
          for (let i = 0; i < drilldownDims.length - 1; i++) {
            const sourceNodeId = `drilldown-${drilldownDims[i].value}`;
            const targetNodeId = `drilldown-${drilldownDims[i + 1].value}`;

            // Bi-directional edge (A <-> B)
            const edgeId = `e-cross-drilldown-${sourceNodeId}-${targetNodeId}`;
            edges.push({
              id: edgeId,
              source: sourceNodeId,
              target: targetNodeId,
              type: "bezier",
              animated: true,
              style: {
                strokeWidth: 1,
                stroke: "#f59e0b",
                strokeDasharray: "5 5",
                opacity: 0.7,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#f59e0b",
              },
              label: "Cross Filter",
              labelStyle: {
                //fill: "#f59e0b",
                fontWeight: 500,
                fontSize: 10,
              },
              labelShowBg: true,
              labelBgStyle: {
                fill: "white",
                stroke: "#f59e0b",
                strokeWidth: 1,
              },
            });

            // Reverse edge for bi-directional appearance (B <-> A)
            const reverseEdgeId = `e-cross-drilldown-${targetNodeId}-${sourceNodeId}-reverse`;
            edges.push({
              id: reverseEdgeId,
              source: targetNodeId,
              target: sourceNodeId,
              type: "bezier",
              animated: true,
              style: {
                strokeWidth: 1,
                stroke: "#f59e0b",
                strokeDasharray: "5 5",
                opacity: 0.7,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#f59e0b",
              },
            });
          }
        }

        // Cross-filtering edge from context parent to drilldown parent (Left --> Left)
        if (contextDims.length > 0 && drilldownDims.length > 0) {
          const crossEdgeId = `e-cross-context-drilldown`;
          edges.push({
            id: crossEdgeId,
            source: `context-parent`,
            target: `drilldown-parent`,
            type: "smoothstep",
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: "#10b981",
              strokeDasharray: "5 5",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#10b981",
            },
            sourceHandle: "left",
            targetHandle: "left",
          });
        }

        // New edge from drilldown parent to context parent (Top to Bottom) using drilldown color
        if (contextDims.length > 0 && drilldownDims.length > 0) {
          const drilldownToContextEdgeId = `e-drilldown-to-context`;
          edges.push({
            id: drilldownToContextEdgeId,
            source: `drilldown-parent`,
            target: `context-parent`,
            type: "smoothstep",
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: "#f59e0b", // Drilldown color
              strokeDasharray: "5 5",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#f59e0b",
            },
            sourceHandle: "top",
            targetHandle: "bottom",
          });
        }
      }
    }

    return {
      nodes,
      edges,
      layoutKey: `${selectedDimensions.length}-${filters}`,
    };
  }, [selectedPeriod, selectedMetrics, selectedDimensions, filters]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // State to track which edge is currently hovered
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Function to apply styles based on hover state and edge type
  const getEdgeStyle = useCallback(
    (edge: Edge) => {
      // Determine base color based on edge type
      let baseColor = "#b1b1b7"; // Default muted color
      let highlightColor = "#b1b1b7"; // Default highlight color
      if (edge.id.includes("e-period-metrics")) {
        baseColor = "#a3a3a3"; // Period to metrics edge color
        highlightColor = "#a3a3a3"; // Gray for highlight
      } else if (edge.id.includes("e-metrics-dimensions")) {
        baseColor = "#a3a3a3"; // Metrics to dimensions edge color
        highlightColor = "#a3a3a3"; // Gray for highlight
      } else if (
        edge.id.includes("e-cross-context-") &&
        !edge.id.includes("-reverse")
      ) {
        baseColor = "#10b981"; // Context cross-filter color
        highlightColor = "#10b981"; // Darker indigo for highlight
      } else if (
        edge.id.includes("e-cross-context-") &&
        edge.id.includes("-reverse")
      ) {
        baseColor = "#10b981"; // Context cross-filter reverse color
        highlightColor = "#10b981"; // Darker indigo for highlight
      } else if (
        edge.id.includes("e-cross-drilldown-") &&
        !edge.id.includes("-reverse")
      ) {
        baseColor = "#f59e0b"; // Drilldown cross-filter color
        highlightColor = "#d97706"; // Darker orange for highlight
      } else if (
        edge.id.includes("e-cross-drilldown-") &&
        edge.id.includes("-reverse")
      ) {
        baseColor = "#f59e0b"; // Drilldown cross-filter reverse color
        highlightColor = "#d97706"; // Darker orange for highlight
      } else if (edge.id === "e-drilldown-to-context") {
        baseColor = "#f59e0b"; // Drilldown to context edge color
        highlightColor = "#d97706"; // Darker orange for highlight
      } else if (edge.id === "e-cross-context-drilldown") {
        baseColor = "#10b981"; // Context-drilldown cross-filter color
        highlightColor = "#10b981"; // Darker green for highlight
      } else if (edge.id.includes("dimensions-")) {
        if (edge.id.includes("context-parent")) {
          baseColor = "#10b981"; // Context parent edge
          highlightColor = "#10b981";
        } else if (edge.id.includes("drilldown-parent")) {
          baseColor = "#f59e0b"; // Drilldown parent edge
          highlightColor = "#d97706";
        } else {
          baseColor = "#b1b1b7"; // Drilldown parent edge
          highlightColor = "#b1b1b7";
        }
      }

      // Apply hover styling
      if (edge.id === hoveredEdgeId) {
        return {
          ...edge.style,
          stroke: highlightColor,
          strokeWidth: edge.style?.strokeWidth
            ? Number(edge.style.strokeWidth) + 1
            : 3,
          opacity: 1, // Full opacity on hover
          cursor: "pointer",
        };
      }

      // Apply base styling
      return {
        ...edge.style,
        stroke: baseColor,
      };
    },
    [hoveredEdgeId],
  );

  // Handler for mouse enter
  const handleEdgeMouseEnter = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setHoveredEdgeId(edge.id);
    },
    [],
  );

  // Handler for mouse leave
  const handleEdgeMouseLeave = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setHoveredEdgeId(null);
    },
    [],
  );

  // Apply styles to edges
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: getEdgeStyle(edge),
    }));
  }, [edges, getEdgeStyle]);

  // Force layout update when data changes
  useEffect(() => {
    setNodes(initialData.nodes);
    setEdges(initialData.edges);

    // Simulate code save behavior with timeout
    const timeout = setTimeout(() => {
      setNodes([...initialData.nodes]); // Force update with new array reference
      setEdges([...initialData.edges]); // Force update with new array reference
    }, 100);

    return () => clearTimeout(timeout);
  }, [initialData.nodes, initialData.edges]);

  const nodeTypes = useMemo(
    () => ({
      period: PeriodNode,
      metrics: MetricsNode,
      dimensions: DimensionsNode,
      context: ContextNode,
      drilldown: DrilldownNode,
      group: GroupNode,
    }),
    [],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      zIndex: 1,
    }),
    [],
  );

  return (
    <div className="w-full h-full">
      <div className="">
        <div className="w-full h-[calc(100vh-8rem)] rounded-lg shadow-lg">
          <ReactFlow
            nodes={nodes}
            edges={styledEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeMouseEnter={handleEdgeMouseEnter}
            onEdgeMouseLeave={handleEdgeMouseLeave}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: false }}
            key={initialData.layoutKey} // Force re-render when filters change
          >
            <Background
              gap={16}
              size={1}
              color="#94a3b8"
              className="dark:opacity-20"
            />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
