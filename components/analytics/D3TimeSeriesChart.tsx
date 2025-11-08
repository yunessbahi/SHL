"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { TimeSeriesPoint } from "@/lib/analytics-api";

interface D3TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  width?: number;
  height?: number;
  showMobileDesktop?: boolean;
  timeInterval?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
}

export default function D3TimeSeriesChart({
  data,
  width = 600,
  height = 300,
  showMobileDesktop = true,
  timeInterval = "daily",
}: D3TimeSeriesChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    // Set up dimensions and margins
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates and process data
    const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
    const processedData = data
      .filter((d) => d.bucket_start && d.total_clicks >= 0)
      .map((d) => {
        // Ensure we have a proper date
        let date: Date;
        try {
          // Handle different timestamp formats
          if (d.bucket_start.includes(".")) {
            // ISO with milliseconds
            date = new Date(d.bucket_start);
          } else {
            // Try parsing without milliseconds
            const cleanDate = d.bucket_start.split(".")[0] + ".000Z";
            date = new Date(cleanDate);
          }

          // If parsing failed, create a fallback date
          if (isNaN(date.getTime())) {
            date = new Date();
          }
        } catch (error) {
          date = new Date();
        }

        return {
          ...d,
          date: date,
          clicks: d.total_clicks || 0,
          mobile: d.mobile_clicks || 0,
          desktop: d.desktop_clicks || 0,
          unique_links: d.unique_links || 0,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (processedData.length === 0) {
      // Show empty state
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#9CA3AF")
        .style("font-size", "14px")
        .text("No data available");
      return;
    }

    // Set up scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(processedData, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(processedData, (d) => Math.max(d.clicks, d.mobile, d.desktop)) ||
          0,
      ])
      .range([innerHeight, 0])
      .nice();

    // Dynamic time formatting based on interval
    const getTimeFormatter = (interval: string) => {
      switch (interval) {
        case "hourly":
          return d3.timeFormat("%H:%M");
        case "daily":
          return d3.timeFormat("%m/%d");
        case "weekly":
          return d3.timeFormat("%m/%d");
        case "monthly":
          return d3.timeFormat("%b %Y");
        case "yearly":
          return d3.timeFormat("%Y");
        default:
          return d3.timeFormat("%m/%d");
      }
    };

    const getAxisTicks = (interval: string, dataLength: number) => {
      switch (interval) {
        case "hourly":
          return Math.min(6, dataLength); // Show every 4 hours max
        case "daily":
          return Math.min(7, dataLength); // Show every day max
        case "weekly":
          return Math.min(4, dataLength); // Show every week max
        case "monthly":
          return Math.min(6, dataLength); // Show every month max
        case "yearly":
          return Math.min(12, dataLength); // Show every year max
        default:
          return Math.min(6, dataLength);
      }
    };

    // Get time formatter and axis ticks
    const timeFormatter = getTimeFormatter(timeInterval);
    const maxTicks = getAxisTicks(timeInterval, processedData.length);

    // Create color scale
    const colorScale = d3
      .scaleOrdinal()
      .domain(["total", "mobile", "desktop"])
      .range(["#3B82F6", "#10B981", "#F59E0B"]);

    // Create line generators
    const totalLine = d3
      .line<any>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.clicks))
      .curve(d3.curveMonotoneX);

    const mobileLine = d3
      .line<any>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.mobile))
      .curve(d3.curveMonotoneX);

    const desktopLine = d3
      .line<any>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.desktop))
      .curve(d3.curveMonotoneX);

    // Add gradient definitions for total line area
    const defs = g.append("defs");

    const totalGradient = defs
      .append("linearGradient")
      .attr("id", "total-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", innerHeight)
      .attr("x2", 0)
      .attr("y2", 0);

    totalGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorScale("total") as string)
      .attr("stop-opacity", 0.1);

    totalGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorScale("total") as string)
      .attr("stop-opacity", 0.3);

    // Add area for total line
    const totalArea = d3
      .area<any>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.clicks))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(processedData)
      .attr("fill", "url(#total-gradient)")
      .attr("d", totalArea);

    // Add total line (main line)
    g.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", colorScale("total") as string)
      .attr("stroke-width", 3)
      .attr("d", totalLine);

    // Add mobile and desktop lines if showMobileDesktop is true
    if (showMobileDesktop) {
      g.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", colorScale("mobile") as string)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", mobileLine);

      g.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", colorScale("desktop") as string)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3")
        .attr("d", desktopLine);
    }

    // Add interactive dots for data points
    const addDataPoints = () => {
      // Total clicks points
      g.selectAll(".total-dot")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("class", "total-dot")
        .attr("cx", (d) => xScale(d.date))
        .attr("cy", (d) => yScale(d.clicks))
        .attr("r", 4)
        .attr("fill", colorScale("total") as string)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .on("mouseover", function (event: any, d: any) {
          // Tooltip
          const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "analytics-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "12px 16px")
            .style("border-radius", "8px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("z-index", 1000)
            .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.3)");

          const timeFormat = getTimeFormatter(timeInterval);
          const formattedDate = d.date.toLocaleDateString();
          const formattedTime = d.date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          tooltip
            .html(
              `
            <div style="margin-bottom: 8px; font-weight: bold; color: ${colorScale("total")}">${formattedDate} ${formattedTime}</div>
            <div style="margin-bottom: 4px;">
              <span style="color: ${colorScale("total")}; font-weight: bold;">Total Clicks:</span> ${d.clicks.toLocaleString()}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: ${colorScale("mobile")}; font-weight: bold;">Mobile:</span> ${d.mobile.toLocaleString()}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: ${colorScale("desktop")}; font-weight: bold;">Desktop:</span> ${d.desktop.toLocaleString()}
            </div>
            <div>
              <span style="color: #6B7280; font-weight: bold;">Unique Links:</span> ${d.unique_links.toLocaleString()}
            </div>
          `,
            )
            .style("left", event.pageX + 15 + "px")
            .style("top", event.pageY - 10 + "px");

          d3.select(this).attr("r", 6).attr("stroke-width", 3);
        })
        .on("mouseout", function () {
          d3.selectAll(".analytics-tooltip").remove();
          d3.select(this).attr("r", 4).attr("stroke-width", 2);
        });

      // Mobile clicks points
      if (showMobileDesktop) {
        g.selectAll(".mobile-dot")
          .data(processedData)
          .enter()
          .append("circle")
          .attr("class", "mobile-dot")
          .attr("cx", (d) => xScale(d.date))
          .attr("cy", (d) => yScale(d.mobile))
          .attr("r", 3)
          .attr("fill", colorScale("mobile") as string)
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .style("cursor", "pointer");
      }

      // Desktop clicks points
      if (showMobileDesktop) {
        g.selectAll(".desktop-dot")
          .data(processedData)
          .enter()
          .append("circle")
          .attr("class", "desktop-dot")
          .attr("cx", (d) => xScale(d.date))
          .attr("cy", (d) => yScale(d.desktop))
          .attr("r", 3)
          .attr("fill", colorScale("desktop") as string)
          .attr("stroke", "white")
          .attr("stroke-width", 1)
          .style("cursor", "pointer");
      }
    };

    addDataPoints();

    // Debug: Log data range and processed data
    console.log("X Scale domain:", xScale.domain());
    console.log("Y Scale domain:", yScale.domain());
    console.log("Processed data length:", processedData.length);
    console.log("Sample data points:", processedData.slice(0, 3));

    // Configure X axis based on interval - force multiple distinct ticks
    let xAxisConfig: any;

    // Ensure we have at least 2 data points for a line chart
    if (processedData.length < 2) {
      console.warn(
        "Not enough data points for line chart:",
        processedData.length,
      );
      // Show at least 2 data points by duplicating with slight offset
      if (processedData.length === 1) {
        const singlePoint = processedData[0];
        const offsetDate = new Date(singlePoint.date.getTime() + 1000); // 1 second later
        processedData.push({
          ...singlePoint,
          date: offsetDate,
          clicks: singlePoint.clicks * 0.9, // Slightly different value
        });
      }
    }

    switch (timeInterval) {
      case "hourly":
        const hourStep = Math.max(
          1,
          Math.floor(processedData.length / Math.min(6, processedData.length)),
        );
        xAxisConfig = d3
          .axisBottom(xScale)
          .ticks(d3.timeHour.every(hourStep))
          .tickFormat(timeFormatter as any);
        break;
      case "daily":
        const dayStep = Math.max(
          1,
          Math.floor(processedData.length / Math.min(7, processedData.length)),
        );
        xAxisConfig = d3
          .axisBottom(xScale)
          .ticks(d3.timeDay.every(dayStep))
          .tickFormat(timeFormatter as any);
        break;
      case "weekly":
        const weekStep = Math.max(
          1,
          Math.floor(processedData.length / Math.min(4, processedData.length)),
        );
        xAxisConfig = d3
          .axisBottom(xScale)
          .ticks(d3.timeWeek.every(weekStep))
          .tickFormat(timeFormatter as any);
        break;
      case "monthly":
        const monthStep = Math.max(
          1,
          Math.floor(processedData.length / Math.min(6, processedData.length)),
        );
        xAxisConfig = d3
          .axisBottom(xScale)
          .ticks(d3.timeMonth.every(monthStep))
          .tickFormat(timeFormatter as any);
        break;
      case "yearly":
        const yearStep = Math.max(
          1,
          Math.floor(processedData.length / Math.min(12, processedData.length)),
        );
        xAxisConfig = d3
          .axisBottom(xScale)
          .ticks(d3.timeYear.every(yearStep))
          .tickFormat(timeFormatter as any);
        break;
      default:
        const defaultStep = Math.max(
          1,
          Math.floor(processedData.length / Math.min(6, processedData.length)),
        );
        xAxisConfig = d3
          .axisBottom(xScale)
          .ticks(processedData.length)
          .tickFormat(timeFormatter as any);
    }

    // Add X axis
    const xAxis = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxisConfig);

    // Style X axis
    xAxis
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6B7280")
      .style("text-anchor", "middle")
      .attr("transform", "rotate(-45)")
      .style("transform-origin", "center right");

    // Add Y axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => d3.format(".2s")(d as number));

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#6B7280");

    // Style axis lines and grid
    g.selectAll(".domain").style("stroke", "#E5E7EB").style("stroke-width", 1);

    g.selectAll(".tick line")
      .style("stroke", "#E5E7EB")
      .style("stroke-width", 1);

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat(() => ""),
      )
      .style("stroke-dasharray", "2,2")
      .style("opacity", 0.3);

    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => ""),
      )
      .style("stroke-dasharray", "2,2")
      .style("opacity", 0.3);

    // Add responsive legend if showMobileDesktop is true
    if (showMobileDesktop) {
      const legend = g
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${innerWidth - 150}, 20)`);

      const legendData = [
        {
          label: "Total",
          color: colorScale("total") as string,
          strokeDasharray: "none",
          lineWidth: 3,
        },
        {
          label: "Mobile",
          color: colorScale("mobile") as string,
          strokeDasharray: "5,5",
          lineWidth: 2,
        },
        {
          label: "Desktop",
          color: colorScale("desktop") as string,
          strokeDasharray: "3,3",
          lineWidth: 2,
        },
      ];

      legendData.forEach((item, i) => {
        const legendRow = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        legendRow
          .append("line")
          .attr("x1", 0)
          .attr("x2", 20)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", item.lineWidth)
          .attr("stroke-dasharray", item.strokeDasharray);

        legendRow
          .append("text")
          .attr("x", 25)
          .attr("y", 0)
          .attr("dy", "0.35em")
          .style("font-size", "12px")
          .style("fill", "#374151")
          .text(item.label);
      });
    }

    // Add title with interval information
    const titleText =
      {
        hourly: "Hourly Clicks (Last 24 Hours)",
        daily: "Daily Clicks (Last 7 Days)",
        weekly: "Weekly Clicks (Last 4 Weeks)",
        monthly: "Monthly Clicks (Last 6 Months)",
        yearly: "Yearly Clicks (Last 12 Months)",
      }[timeInterval] || "Clicks Over Time";

    g.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text(titleText);
  }, [data, width, height, showMobileDesktop, timeInterval]);

  return (
    <div className="w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full overflow-visible"
        style={{ minWidth: "400px", minHeight: "250px" }}
      />
    </div>
  );
}
