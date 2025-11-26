"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TooltipProvider as GlobalTooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/global-tooltip";
import { Info, Link2 } from "lucide-react";

interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  dimension: string;
  color: string;
  clicks: number;
  records: Array<Record<string, any>>;
}

interface LinkData extends d3.SimulationLinkDatum<NodeData> {
  clicks: number;
  records: Array<Record<string, any>>;
}

interface NetworkVizProps {
  data: Array<Record<string, any>>;
  dimensions: string[];
  className?: string;
}

const NetworkViz = ({ data, dimensions, className }: NetworkVizProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);
  const selectedNodeRef = useRef<NodeData | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(
    null,
  );
  const [layoutMode, setLayoutMode] = useState<"force" | "bipartite">("force");
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const isIsolatedRef = useRef(false);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Build graph data
    const nodesMap = new Map<string, NodeData>();
    const links: LinkData[] = [];
    const linkMap = new Map<string, LinkData>();

    const colorPalette = [
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
      "#f97316",
      "#84cc16",
    ];
    const colorScale: Record<string, string> = {};
    dimensions.forEach((dim, index) => {
      colorScale[dim] = colorPalette[index % colorPalette.length];
    });

    data.forEach((record) => {
      const recordNodes: string[] = [];

      dimensions.forEach((dim) => {
        const value = record[dim];
        if (value !== null && value !== undefined) {
          const nodeId = `${dim}:${value}`;

          if (!nodesMap.has(nodeId)) {
            nodesMap.set(nodeId, {
              id: nodeId,
              label: String(value),
              dimension: dim,
              color: colorScale[dim],
              clicks: 0,
              records: [],
            });
          }

          const node = nodesMap.get(nodeId)!;
          node.clicks += record.clicks || 0;
          node.records.push(record);
          recordNodes.push(nodeId);
        }
      });

      // Create links between nodes in the same record
      for (let i = 0; i < recordNodes.length; i++) {
        for (let j = i + 1; j < recordNodes.length; j++) {
          const linkId = `${recordNodes[i]}-${recordNodes[j]}`;
          const reverseLinkId = `${recordNodes[j]}-${recordNodes[i]}`;

          if (!linkMap.has(linkId) && !linkMap.has(reverseLinkId)) {
            const link: LinkData = {
              source: recordNodes[i],
              target: recordNodes[j],
              clicks: record.clicks || 0,
              records: [record],
            };
            links.push(link);
            linkMap.set(linkId, link);
          } else {
            const existingLink =
              linkMap.get(linkId) || linkMap.get(reverseLinkId)!;
            existingLink.clicks += record.clicks || 0;
            existingLink.records.push(record);
          }
        }
      }
    });

    const nodes = Array.from(nodesMap.values());
    const maxClicks = Math.max(...links.map((l) => l.clicks), 1);

    // SVG setup
    const width = 694;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Shadow filter
    const filter = defs
      .append("filter")
      .attr("id", "node-shadow")
      .attr("height", "150%")
      .attr("width", "150%");
    filter
      .append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3);
    filter
      .append("feOffset")
      .attr("dx", 2)
      .attr("dy", 3)
      .attr("result", "offsetblur");
    filter
      .append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.3);
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow marker
    const arrowMarker = defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 9)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto");
    arrowMarker
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "hsl(var(--muted-foreground))");

    const g = svg.append("g");

    const getNodeRadius = (d: NodeData) =>
      Math.max(10, Math.sqrt(d.clicks) * 4);

    // Links
    const link = g
      .append("g")
      .attr("stroke", "hsl(var(--muted-foreground))")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", (d) => 0.3 + (d.clicks / maxClicks) * 0.7)
      .attr("marker-start", "url(#arrowhead)")
      .attr("marker-end", "url(#arrowhead)");

    // Link labels
    const linkLabels = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "400")
      .attr("fill", "hsl(var(--foreground))")
      .attr("opacity", 0)
      .attr("pointer-events", "none")
      .style("paint-order", "stroke")
      .style("stroke", "hsl(var(--background))")
      .style("stroke-width", "1px")
      .text((d) => d.clicks);

    // Nodes
    const node = g
      .append("g")
      .attr("stroke", "hsl(var(--background))")
      //.attr('stroke-width', 2.5)
      .attr("stroke-width", 1)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("data-node", "true");

    node
      .append("circle")
      .attr("r", getNodeRadius)
      .attr("fill", (d) => d.color)
      .style("cursor", "pointer")
      .style("filter", "url(#node-shadow)");

    node
      .append("text")
      .text((d) =>
        d.label.length > 20 ? d.label.substring(0, 17) + "..." : d.label,
      )
      .attr("x", 0)
      .attr("y", (d) => -(getNodeRadius(d) + 8))
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-weight", "400")
      .style("pointer-events", "none")
      .style("user-select", "none")
      .style("paint-order", "stroke")
      .style("stroke", "hsl(var(--background))")
      .style("stroke-width", "1px");

    // Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance((d) => 150 - d.clicks * 10)
          .strength((d) => 0.3 + (d.clicks / maxClicks) * 0.5),
      )
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => getNodeRadius(d) + 10),
      );

    // Apply layout based on mode
    if (layoutMode === "bipartite") {
      // Bipartite layout - organize by dimensions
      const dimensionGroups = d3.group(nodes, (d) => d.dimension);
      const numDimensions = dimensionGroups.size;
      const columnWidth = width / (numDimensions + 1);

      let dimIndex = 0;
      dimensionGroups.forEach((dimNodes, dimName) => {
        const x = columnWidth * (dimIndex + 1);
        const ySpacing = height / (dimNodes.length + 1);

        dimNodes.forEach((node, i) => {
          const y = ySpacing * (i + 1);
          node.fx = x;
          node.fy = y;
        });

        dimIndex++;
      });

      // Weaker forces for bipartite layout
      simulation
        .force("charge", d3.forceManyBody().strength(-100))
        .force("x", d3.forceX((d: any) => d.fx).strength(1))
        .force("y", d3.forceY((d: any) => d.fy).strength(0.5));
    } else {
      // Force-directed layout - unpin nodes
      nodes.forEach((node) => {
        node.fx = null;
        node.fy = null;
      });

      simulation
        .force("charge", d3.forceManyBody().strength(-800))
        .force("x", d3.forceX(width / 2).strength(0.01))
        .force("y", d3.forceY(height / 2).strength(0.01));
    }

    simulation.on("tick", ticked);
    simulationRef.current = simulation;

    // Immediately update positions to sync visual elements with data changes
    ticked();

    function ticked() {
      if (layoutMode === "force") {
        nodes.forEach((d) => {
          if (d.x !== undefined) d.x = Math.max(50, Math.min(644, d.x));
          if (d.y !== undefined) d.y = Math.max(50, Math.min(450, d.y));
        });
      }

      link
        .attr("x1", (d: any) => {
          const rSource = getNodeRadius(d.source);
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.source.x;
          const ux = dx / dist;
          const uy = dy / dist;
          return d.source.x + ux * rSource;
        })
        .attr("y1", (d: any) => {
          const rSource = getNodeRadius(d.source);
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.source.y;
          const ux = dx / dist;
          const uy = dy / dist;
          return d.source.y + uy * rSource;
        })
        .attr("x2", (d: any) => {
          const rTarget = getNodeRadius(d.target);
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.target.x;
          const ux = dx / dist;
          const uy = dy / dist;
          return d.target.x - ux * rTarget;
        })
        .attr("y2", (d: any) => {
          const rTarget = getNodeRadius(d.target);
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.target.y;
          const ux = dx / dist;
          const uy = dy / dist;
          return d.target.y - uy * rTarget;
        });

      linkLabels
        .attr("x", (d: any) => {
          const rSource = getNodeRadius(d.source);
          const rTarget = getNodeRadius(d.target);
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.source.x;
          const ux = dx / dist;
          const uy = dy / dist;
          const x1 = d.source.x + ux * rSource;
          const x2 = d.target.x - ux * rTarget;
          return (x1 + x2) / 2;
        })
        .attr("y", (d: any) => {
          const rSource = getNodeRadius(d.source);
          const rTarget = getNodeRadius(d.target);
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return d.source.y;
          const ux = dx / dist;
          const uy = dy / dist;
          const y1 = d.source.y + uy * rSource;
          const y2 = d.target.y - uy * rTarget;
          return (y1 + y2) / 2;
        });

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    // Drag behavior
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);

      // In bipartite mode, restore the original fixed positions
      if (layoutMode === "bipartite") {
        // Find the node's original position by its dimension
        const node = event.subject;
        const dimensionGroups = d3.group(nodes, (d) => d.dimension);
        const numDimensions = dimensionGroups.size;
        const columnWidth = width / (numDimensions + 1);

        let dimIndex = 0;
        for (const [dimName, dimNodes] of Array.from(dimensionGroups)) {
          if (dimName === node.dimension) {
            const x = columnWidth * (dimIndex + 1);
            const nodeIndex = dimNodes.findIndex((n) => n.id === node.id);
            const ySpacing = height / (dimNodes.length + 1);
            const y = ySpacing * (nodeIndex + 1);

            event.subject.fx = x;
            event.subject.fy = y;
            break;
          }
          dimIndex++;
        }
      } else {
        // In force-directed mode, release the node
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }

    node.call(
      d3
        .drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    );

    // Highlight connections on hover
    const showConnections = (d: NodeData) => {
      const connectedNodeIds = new Set<string>();
      const connectedLinks = new Set<LinkData>();

      links.forEach((l) => {
        if ((l.source as any).id === d.id) {
          connectedNodeIds.add((l.target as any).id);
          connectedLinks.add(l);
        }
        if ((l.target as any).id === d.id) {
          connectedNodeIds.add((l.source as any).id);
          connectedLinks.add(l);
        }
      });

      node
        .selectAll("circle")
        .transition()
        .duration(300)
        .attr("opacity", (n: any) =>
          n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.15,
        );

      node
        .selectAll("text")
        .transition()
        .duration(300)
        .attr("opacity", (n: any) =>
          n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3,
        );

      link
        .transition()
        .duration(300)
        .attr("opacity", (l) => (connectedLinks.has(l) ? 0.9 : 0.05))
        .attr("stroke", (l) =>
          connectedLinks.has(l)
            ? "hsl(var(--foreground))"
            : "hsl(var(--muted-foreground))",
        );

      linkLabels
        .transition()
        .duration(300)
        .attr("opacity", (l) => (connectedLinks.has(l) ? 1 : 0));
    };

    const resetHighlight = () => {
      node.selectAll("circle").transition().duration(300).attr("opacity", 1);
      node.selectAll("text").transition().duration(300).attr("opacity", 1);
      link
        .transition()
        .duration(300)
        .attr("opacity", (d) => 0.3 + (d.clicks / maxClicks) * 0.7)
        .attr("stroke", "hsl(var(--muted-foreground))");
      linkLabels.transition().duration(300).attr("opacity", 0);
    };

    const isolateNeighborhood = (d: NodeData) => {
      const connectedNodeIds = new Set([d.id]);
      const connectedLinks = new Set<LinkData>();

      links.forEach((l) => {
        if ((l.source as any).id === d.id || (l.target as any).id === d.id) {
          connectedNodeIds.add((l.source as any).id);
          connectedNodeIds.add((l.target as any).id);
          connectedLinks.add(l);
        }
      });

      node
        .selectAll("circle")
        .transition()
        .duration(500)
        .attr("opacity", (n: any) => (connectedNodeIds.has(n.id) ? 1 : 0.15));

      node
        .selectAll("text")
        .transition()
        .duration(500)
        .attr("opacity", (n: any) => (connectedNodeIds.has(n.id) ? 1 : 0));

      link
        .transition()
        .duration(500)
        .attr("opacity", (l) => (connectedLinks.has(l) ? 0.9 : 0.02))
        .attr("stroke", (l) =>
          connectedLinks.has(l)
            ? "hsl(var(--foreground))"
            : "hsl(var(--muted-foreground))",
        );

      linkLabels
        .transition()
        .duration(500)
        .attr("opacity", (l) => (connectedLinks.has(l) ? 1 : 0));
    };

    // Node interactions
    node.on("click", function (event, d) {
      event.stopPropagation();
      isIsolatedRef.current = true;
      selectedNodeRef.current = d;
      setSelectedDimension(null);
      toast("Isolated Mode", {
        description: `Showing neighborhood of ${d.label}. Click background to exit.`,
      });
      isolateNeighborhood(d);
    });

    node.on("mouseenter", function (event, d) {
      if (!isIsolatedRef.current) showConnections(d);
      setHoveredNode(d);
    });

    node.on("mouseleave", function () {
      if (!isIsolatedRef.current) resetHighlight();
      setHoveredNode(null);
    });

    // Click background to reset
    svg.on("click", (event) => {
      if (event.target === svg.node()) {
        isIsolatedRef.current = false;
        selectedNodeRef.current = null;
        setSelectedDimension(null);
        toast.dismiss();
        resetHighlight();
      }
    });

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom).on("dblclick.zoom", null);

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, layoutMode]);

  const handleDimensionClick = (dimension: string) => {
    if (selectedDimension === dimension) {
      setSelectedDimension(null);
      selectedNodeRef.current = null;
      isIsolatedRef.current = false;
      toast.dismiss();

      // Reset all highlights
      if (simulationRef.current) {
        const svg = d3.select(svgRef.current);
        const g = svg.select("g");
        const nodes = g.selectAll("g[data-node]");
        const links = g.selectAll("line");
        const linkLabels = g.selectAll(".link-labels text");

        nodes.selectAll("circle").transition().duration(300).attr("opacity", 1);
        nodes.selectAll("text").transition().duration(300).attr("opacity", 1);
        links
          .transition()
          .duration(300)
          .attr("opacity", 0.6)
          .attr("stroke", "hsl(var(--muted-foreground))");
        linkLabels.transition().duration(300).attr("opacity", 0);
      }
    } else {
      setSelectedDimension(dimension);
      selectedNodeRef.current = null;
      isIsolatedRef.current = false;

      // Highlight nodes of this dimension
      if (simulationRef.current) {
        const svg = d3.select(svgRef.current);
        const g = svg.select("g");
        const nodes = g.selectAll("g[data-node]");
        const links = g.selectAll("line");
        const linkLabels = g.selectAll(".link-labels text");

        nodes
          .selectAll("circle")
          .transition()
          .duration(300)
          .attr("opacity", (d: any) => (d.dimension === dimension ? 1 : 0.15));

        nodes
          .selectAll("text")
          .transition()
          .duration(300)
          .attr("opacity", (d: any) => (d.dimension === dimension ? 1 : 0.3));

        links.transition().duration(300).attr("opacity", 0.1);
        linkLabels.transition().duration(300).attr("opacity", 0);
      }
    }
  };

  const legendItems = dimensions.map((dim, index) => {
    const colorClasses = [
      "bg-blue-500",
      "bg-violet-500",
      "bg-pink-500",
      "bg-amber-500",
      "bg-emerald-500",
      "bg-cyan-500",
      "bg-orange-500",
      "bg-lime-500",
    ];
    const labels: Record<string, string> = {
      device_type: "Device",
      browser_name: "Browser",
      campaign: "Campaign",
      ref_source: "Source",
      link: "Link",
      utm_source: "Source (UTM)",
      utm_medium: "Medium (UTM)",
      utm_campaign: "Campaign (UTM)",
      utm_term: "Term (UTM)",
      utm_content: "Content (UTM)",
    };
    const generatedLabel =
      labels[dim] ||
      (dim.startsWith("utm_")
        ? dim
            .replace(/^utm_/, "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()) + " (UTM)"
        : dim.replace(/_/g, " "));
    return {
      dimension: dim,
      color: colorClasses[index % colorClasses.length],
      label: generatedLabel,
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-6">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Network Visualization
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <strong>Click</strong> nodes to isolate neighborhood
                </p>
                <p>
                  <strong>Click background</strong> to reset
                </p>
                <p>
                  <strong>Drag</strong> to reposition
                </p>
                <p>
                  <strong>Scroll</strong> to zoom
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <div className="min-w-[220px]">
          <RadioGroup
            value={layoutMode}
            onValueChange={(value: "force" | "bipartite") =>
              setLayoutMode(value)
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="force" id="force" />
              <Label
                htmlFor="force"
                className="cursor-pointer text-xs flex-nowrap"
              >
                Force-Directed
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bipartite" id="bipartite" />
              <Label htmlFor="bipartite" className="cursor-pointer text-xs">
                Bipartite
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardHeader>

      <CardContent>
        <GlobalTooltipProvider>
          <div className={`w-full ${className || ""}`}>
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-3">
                    {legendItems.map((item) => (
                      <Badge
                        key={item.dimension}
                        variant={
                          selectedDimension === item.dimension
                            ? "primary"
                            : "secondary"
                        }
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => handleDimensionClick(item.dimension)}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${item.color}`}
                        ></div>
                        <span className="text-xs">{item.label}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden relative">
                {hoveredNode && (
                  <div className="absolute top-4 right-4 p-3 max-w-xs z-0">
                    <div className="font-mono text-xs text-muted-foreground/80">
                      <div className="font-bold">
                        {hoveredNode.label.toUpperCase()}
                      </div>
                      <Separator className="my-1 opacity-20" />
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">Dimension:</span>
                        <span>{hoveredNode.dimension}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Clicks:</span>
                        <span className="font-mono">{hoveredNode.clicks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Records:</span>
                        <span className="font-mono">
                          {hoveredNode.records.length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <svg
                  ref={svgRef}
                  width={694}
                  height={600}
                  style={{ cursor: "grab" }}
                  className="relative z-10"
                />
              </div>
            </div>
          </div>
        </GlobalTooltipProvider>
      </CardContent>
    </Card>
  );
};

export default NetworkViz;
