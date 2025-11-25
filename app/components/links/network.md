# version 1

```Typescript
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const AnalyticsNetworkViz = () => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const data = [
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Black Friday 2025",
      "ref_source": "localhost",
      "link": "bf25-home-main-b2",
      "utm_source": "instagram",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Creator Partnership Q4",
      "ref_source": "localhost",
      "link": "creator-q4-s1",
      "utm_source": "influencer-network",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Summer Collection Launch",
      "ref_source": "localhost",
      "link": "linkedin-bio",
      "utm_source": "traffic-hub",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Ramadan Offers",
      "ref_source": "localhost",
      "link": "promo-code",
      "utm_source": "instagram",
      "clicks": 2,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Ramadan Offers",
      "ref_source": "localhost",
      "link": "promo-code",
      "utm_source": "traffic-hub",
      "clicks": 1,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Retargeting Funnel 2025",
      "ref_source": "Reddit",
      "link": "retargeting-entry",
      "utm_source": null,
      "clicks": 1,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Loyalty Rewards Push",
      "ref_source": "localhost",
      "link": "loyalty-hub-direct",
      "utm_source": "email-list",
      "clicks": 1,
      "unique_visitors": 1
    }
  ];

  useEffect(() => {
    const dimensions = ['device_type', 'browser_name', 'campaign', 'ref_source', 'link', 'utm_source'];

    // Create nodes and links
    const nodesMap = new Map();
    const links = [];

    // Color scheme for different dimension types
    const colorScale = {
      'device_type': '#3b82f6',
      'browser_name': '#8b5cf6',
      'campaign': '#ec4899',
      'ref_source': '#f59e0b',
      'link': '#10b981',
      'utm_source': '#06b6d4'
    };

    data.forEach((record, idx) => {
      const recordNodes = [];

      dimensions.forEach(dim => {
        const value = record[dim];
        if (value !== null && value !== undefined) {
          const nodeId = `${dim}:${value}`;

          if (!nodesMap.has(nodeId)) {
            nodesMap.set(nodeId, {
              id: nodeId,
              label: value,
              dimension: dim,
              color: colorScale[dim],
              clicks: 0,
              records: []
            });
          }

          const node = nodesMap.get(nodeId);
          node.clicks += record.clicks;
          node.records.push(record);
          recordNodes.push(nodeId);
        }
      });

      // Create links between nodes in the same record
      for (let i = 0; i < recordNodes.length; i++) {
        for (let j = i + 1; j < recordNodes.length; j++) {
          links.push({
            source: recordNodes[i],
            target: recordNodes[j],
            clicks: record.clicks,
            record: record
          });
        }
      }
    });

    const nodes = Array.from(nodesMap.values());

    // SVG setup
    const width = 1200;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.sqrt(d.clicks) * 1.5);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => Math.max(8, Math.sqrt(d.clicks) * 3))
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    node.append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label)
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#1e293b')
      .attr('font-weight', '500')
      .style('pointer-events', 'none');

    // Interactions
    node.on('click', function(event, d) {
      event.stopPropagation();
      setSelectedNode(d);

      // Highlight connected nodes
      const connectedNodeIds = new Set();
      links.forEach(l => {
        if (l.source.id === d.id) connectedNodeIds.add(l.target.id);
        if (l.target.id === d.id) connectedNodeIds.add(l.source.id);
      });

      node.selectAll('circle')
        .attr('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.2);

      link.attr('opacity', l =>
        l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
      );
    });

    node.on('mouseenter', function(event, d) {
      setHoveredNode(d);
    });

    node.on('mouseleave', function() {
      setHoveredNode(null);
    });

    svg.on('click', () => {
      setSelectedNode(null);
      node.selectAll('circle').attr('opacity', 1);
      link.attr('opacity', 0.4);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

  }, []);

  return (
    <div className="w-full h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Analytics Network Visualization</h1>
          <p className="text-sm text-slate-600 mb-4">Click nodes to highlight connections. Drag to reposition. Scroll to zoom.</p>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-xs text-slate-700">Device Type</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-violet-500"></div>
              <span className="text-xs text-slate-700">Browser</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span className="text-xs text-slate-700">Campaign</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span className="text-xs text-slate-700">Ref Source</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-700">Link</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
              <span className="text-xs text-slate-700">UTM Source</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden relative">
          <svg ref={svgRef} width="100%" height="100%" className="absolute inset-0"></svg>
        </div>

        {(selectedNode || hoveredNode) && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
            <h3 className="font-semibold text-slate-800 mb-2">
              {(selectedNode || hoveredNode).label}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Dimension:</span>
                <p className="font-medium text-slate-800">{(selectedNode || hoveredNode).dimension}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Clicks:</span>
                <p className="font-medium text-slate-800">{(selectedNode || hoveredNode).clicks}</p>
              </div>
              <div>
                <span className="text-slate-500">Records:</span>
                <p className="font-medium text-slate-800">{(selectedNode || hoveredNode).records.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsNetworkViz;

```

# version 2: clickable legend keys, nodes shadow 3d effect

```Typescript
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const AnalyticsNetworkViz = () => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);

  const data = [
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Black Friday 2025",
      "ref_source": "localhost",
      "link": "bf25-home-main-b2",
      "utm_source": "instagram",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Creator Partnership Q4",
      "ref_source": "localhost",
      "link": "creator-q4-s1",
      "utm_source": "influencer-network",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Summer Collection Launch",
      "ref_source": "localhost",
      "link": "linkedin-bio",
      "utm_source": "traffic-hub",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Ramadan Offers",
      "ref_source": "localhost",
      "link": "promo-code",
      "utm_source": "instagram",
      "clicks": 2,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Ramadan Offers",
      "ref_source": "localhost",
      "link": "promo-code",
      "utm_source": "traffic-hub",
      "clicks": 1,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Retargeting Funnel 2025",
      "ref_source": "Reddit",
      "link": "retargeting-entry",
      "utm_source": null,
      "clicks": 1,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Loyalty Rewards Push",
      "ref_source": "localhost",
      "link": "loyalty-hub-direct",
      "utm_source": "email-list",
      "clicks": 1,
      "unique_visitors": 1
    }
  ];

  useEffect(() => {
    const dimensions = ['device_type', 'browser_name', 'campaign', 'ref_source', 'link', 'utm_source'];

    // Create nodes and links
    const nodesMap = new Map();
    const links = [];

    // Color scheme for different dimension types
    const colorScale = {
      'device_type': '#3b82f6',
      'browser_name': '#8b5cf6',
      'campaign': '#ec4899',
      'ref_source': '#f59e0b',
      'link': '#10b981',
      'utm_source': '#06b6d4'
    };

    data.forEach((record, idx) => {
      const recordNodes = [];

      dimensions.forEach(dim => {
        const value = record[dim];
        if (value !== null && value !== undefined) {
          const nodeId = `${dim}:${value}`;

          if (!nodesMap.has(nodeId)) {
            nodesMap.set(nodeId, {
              id: nodeId,
              label: value,
              dimension: dim,
              color: colorScale[dim],
              clicks: 0,
              records: []
            });
          }

          const node = nodesMap.get(nodeId);
          node.clicks += record.clicks;
          node.records.push(record);
          recordNodes.push(nodeId);
        }
      });

      // Create links between nodes in the same record
      for (let i = 0; i < recordNodes.length; i++) {
        for (let j = i + 1; j < recordNodes.length; j++) {
          links.push({
            source: recordNodes[i],
            target: recordNodes[j],
            clicks: record.clicks,
            record: record
          });
        }
      }
    });

    const nodes = Array.from(nodesMap.values());

    // SVG setup
    const width = 1200;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add shadow filter for 3D effect
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('height', '150%')
      .attr('width', '150%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);

    filter.append('feOffset')
      .attr('dx', 2)
      .attr('dy', 3)
      .attr('result', 'offsetblur');

    filter.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', 0.3);

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.sqrt(d.clicks) * 1.5);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => Math.max(8, Math.sqrt(d.clicks) * 3))
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'url(#node-shadow)');

    node.append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label)
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#1e293b')
      .attr('font-weight', '500')
      .style('pointer-events', 'none');

    // Interactions
    node.on('click', function(event, d) {
      event.stopPropagation();
      setSelectedNode(d);
      setSelectedDimension(null);

      // Highlight connected nodes
      const connectedNodeIds = new Set();
      links.forEach(l => {
        if (l.source.id === d.id) connectedNodeIds.add(l.target.id);
        if (l.target.id === d.id) connectedNodeIds.add(l.source.id);
      });

      node.selectAll('circle')
        .attr('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.2);

      link.attr('opacity', l =>
        l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
      );
    });

    node.on('mouseenter', function(event, d) {
      setHoveredNode(d);
    });

    node.on('mouseleave', function() {
      setHoveredNode(null);
    });

    svg.on('click', () => {
      setSelectedNode(null);
      setSelectedDimension(null);
      node.selectAll('circle').attr('opacity', 1);
      link.attr('opacity', 0.4);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Store simulation reference for dimension filtering
    window.networkSimulation = { simulation, node, link, nodes };

  }, []);

  const handleDimensionClick = (dimension) => {
    if (selectedDimension === dimension) {
      // Deselect
      setSelectedDimension(null);
      setSelectedNode(null);
      if (window.networkSimulation) {
        const { node, link } = window.networkSimulation;
        node.selectAll('circle').attr('opacity', 1);
        link.attr('opacity', 0.4);
      }
    } else {
      // Select dimension
      setSelectedDimension(dimension);
      setSelectedNode(null);
      if (window.networkSimulation) {
        const { node, link, nodes } = window.networkSimulation;

        // Highlight only nodes of this dimension
        const dimensionNodeIds = new Set(
          nodes.filter(n => n.dimension === dimension).map(n => n.id)
        );

        node.selectAll('circle')
          .attr('opacity', n => dimensionNodeIds.has(n.id) ? 1 : 0.15);

        link.attr('opacity', l =>
          dimensionNodeIds.has(l.source.id) || dimensionNodeIds.has(l.target.id) ? 0.6 : 0.05
        );
      }
    }
  };

  const legendItems = [
    { dimension: 'device_type', color: 'bg-blue-500', label: 'Device Type' },
    { dimension: 'browser_name', color: 'bg-violet-500', label: 'Browser' },
    { dimension: 'campaign', color: 'bg-pink-500', label: 'Campaign' },
    { dimension: 'ref_source', color: 'bg-amber-500', label: 'Ref Source' },
    { dimension: 'link', color: 'bg-emerald-500', label: 'Link' },
    { dimension: 'utm_source', color: 'bg-cyan-500', label: 'UTM Source' },
  ];

  return (
    <div className="w-full h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Analytics Network Visualization</h1>
          <p className="text-sm text-slate-600 mb-4">Click nodes to highlight connections. Drag to reposition. Scroll to zoom.</p>

          <div className="flex flex-wrap gap-3 mb-4">
            {legendItems.map(item => (
              <button
                key={item.dimension}
                onClick={() => handleDimensionClick(item.dimension)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  selectedDimension === item.dimension
                    ? 'bg-slate-200 ring-2 ring-slate-400'
                    : 'bg-white hover:bg-slate-100'
                } cursor-pointer shadow-sm`}
              >
                <div className={`w-4 h-4 rounded-full ${item.color} shadow-md`}></div>
                <span className="text-xs font-medium text-slate-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden relative">
          <svg ref={svgRef} width="100%" height="100%" className="absolute inset-0"></svg>
        </div>

        {(selectedNode || hoveredNode) && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
            <h3 className="font-semibold text-slate-800 mb-2">
              {(selectedNode || hoveredNode).label}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Dimension:</span>
                <p className="font-medium text-slate-800">{(selectedNode || hoveredNode).dimension}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Clicks:</span>
                <p className="font-medium text-slate-800">{(selectedNode || hoveredNode).clicks}</p>
              </div>
              <div>
                <span className="text-slate-500">Records:</span>
                <p className="font-medium text-slate-800">{(selectedNode || hoveredNode).records.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsNetworkViz;
```

# version 3: enhance graph edges, implement isolation on node click and exit on background click

```Typescript

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const AnalyticsNetworkViz = () => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [isolatedNode, setIsolatedNode] = useState(null);
  const isIsolatedRef = useRef(false);

  const data = [
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Black Friday 2025",
      "ref_source": "localhost",
      "link": "bf25-home-main-b2",
      "utm_source": "instagram",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Creator Partnership Q4",
      "ref_source": "localhost",
      "link": "creator-q4-s1",
      "utm_source": "influencer-network",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Summer Collection Launch",
      "ref_source": "localhost",
      "link": "linkedin-bio",
      "utm_source": "traffic-hub",
      "clicks": 5,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Ramadan Offers",
      "ref_source": "localhost",
      "link": "promo-code",
      "utm_source": "instagram",
      "clicks": 2,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Ramadan Offers",
      "ref_source": "localhost",
      "link": "promo-code",
      "utm_source": "traffic-hub",
      "clicks": 1,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Retargeting Funnel 2025",
      "ref_source": "Reddit",
      "link": "retargeting-entry",
      "utm_source": null,
      "clicks": 1,
      "unique_visitors": 1
    },
    {
      "device_type": "Desktop",
      "browser_name": "Chrome",
      "campaign": "Loyalty Rewards Push",
      "ref_source": "localhost",
      "link": "loyalty-hub-direct",
      "utm_source": "email-list",
      "clicks": 1,
      "unique_visitors": 1
    }
  ];

  useEffect(() => {
    const dimensions = ['device_type', 'browser_name', 'campaign', 'ref_source', 'link', 'utm_source'];

    // Create nodes and links
    const nodesMap = new Map();
    const links = [];
    const linkMap = new Map();

    // Color scheme for different dimension types
    const colorScale = {
      'device_type': '#3b82f6',
      'browser_name': '#8b5cf6',
      'campaign': '#ec4899',
      'ref_source': '#f59e0b',
      'link': '#10b981',
      'utm_source': '#06b6d4'
    };

    data.forEach((record, idx) => {
      const recordNodes = [];

      dimensions.forEach(dim => {
        const value = record[dim];
        if (value !== null && value !== undefined) {
          const nodeId = `${dim}:${value}`;

          if (!nodesMap.has(nodeId)) {
            nodesMap.set(nodeId, {
              id: nodeId,
              label: value,
              dimension: dim,
              color: colorScale[dim],
              clicks: 0,
              records: []
            });
          }

          const node = nodesMap.get(nodeId);
          node.clicks += record.clicks;
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
            const link = {
              source: recordNodes[i],
              target: recordNodes[j],
              clicks: record.clicks,
              records: [record]
            };
            links.push(link);
            linkMap.set(linkId, link);
          } else {
            const existingLink = linkMap.get(linkId) || linkMap.get(reverseLinkId);
            existingLink.clicks += record.clicks;
            existingLink.records.push(record);
          }
        }
      }
    });

    const nodes = Array.from(nodesMap.values());

    // SVG setup
    const width = 1200;
    const height = 800;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add shadow filter for 3D effect
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('height', '150%')
      .attr('width', '150%');

    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 3);

    filter.append('feOffset')
      .attr('dx', 2)
      .attr('dy', 3)
      .attr('result', 'offsetblur');

    filter.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', 0.3);

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom)
      .on('dblclick.zoom', null); // Disable double-click zoom

    // Enhanced force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    // Links with gradient
    const linkGroup = g.append('g').attr('class', 'links');

    // Calculate max clicks for opacity scaling
    const maxClicks = Math.max(...links.map(l => l.clicks));

    const link = linkGroup.selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', d => 0.3 + (d.clicks / maxClicks) * 0.7)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)')
      .style('transition', 'all 0.3s ease');

    // Link labels (hidden by default)
    const linkLabels = g.append('g').attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .attr('opacity', 0)
      .attr('pointer-events', 'none')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', '3px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')
      .text(d => d.clicks);

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', d => Math.max(10, Math.sqrt(d.clicks) * 4))
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .style('filter', 'url(#node-shadow)')
      .style('transition', 'all 0.3s ease');

    node.append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label)
      .attr('x', 0)
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#1e293b')
      .attr('font-weight', '600')
      .style('pointer-events', 'none')
      .style('paint-order', 'stroke')
      .style('stroke', '#fff')
      .style('stroke-width', '3px')
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round');

    // Interactions
    node.on('click', function(event, d) {
      event.stopPropagation();
      isIsolatedRef.current = true;
      setIsolatedNode(d);
      setSelectedNode(d);
      setSelectedDimension(null);

      isolateNeighborhood(d);
    });

    node.on('mouseenter', function(event, d) {
      setHoveredNode(d);
      // Only show hover connections if not in isolation mode
      if (!isIsolatedRef.current) {
        showConnections(d);
      }
    });

    node.on('mouseleave', function() {
      setHoveredNode(null);
      // Only reset on mouse leave if not in isolation mode
      if (!isIsolatedRef.current) {
        resetHighlight();
      }
    });

    function showConnections(d) {
      const connectedNodeIds = new Set();
      const connectedLinks = new Set();

      links.forEach(l => {
        if (l.source.id === d.id) {
          connectedNodeIds.add(l.target.id);
          connectedLinks.add(l);
        }
        if (l.target.id === d.id) {
          connectedNodeIds.add(l.source.id);
          connectedLinks.add(l);
        }
      });

      node.selectAll('circle')
        .transition()
        .duration(300)
        .attr('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.15)
        .attr('r', n => {
          const baseR = Math.max(10, Math.sqrt(n.clicks) * 4);
          return n.id === d.id ? baseR * 1.2 : baseR;
        });

      node.selectAll('text')
        .transition()
        .duration(300)
        .attr('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3);

      link
        .transition()
        .duration(300)
        .attr('opacity', l => connectedLinks.has(l) ? 0.9 : 0.05)
        .attr('stroke', l => connectedLinks.has(l) ? '#475569' : '#94a3b8')
        .attr('stroke-width', 2);

      linkLabels
        .transition()
        .duration(300)
        .attr('opacity', l => connectedLinks.has(l) ? 1 : 0);
    }

    function isolateNeighborhood(d) {
      const connectedNodeIds = new Set([d.id]);
      const connectedLinks = new Set();

      links.forEach(l => {
        if (l.source.id === d.id || l.target.id === d.id) {
          connectedNodeIds.add(l.source.id);
          connectedNodeIds.add(l.target.id);
          connectedLinks.add(l);
        }
      });

      node.selectAll('circle')
        .transition()
        .duration(500)
        .attr('opacity', n => connectedNodeIds.has(n.id) ? 1 : 0.15)
        .attr('r', n => {
          const baseR = Math.max(10, Math.sqrt(n.clicks) * 4);
          return n.id === d.id ? baseR * 1.3 : baseR;
        });

      node.selectAll('text')
        .transition()
        .duration(500)
        .attr('opacity', n => connectedNodeIds.has(n.id) ? 1 : 0);

      link
        .transition()
        .duration(500)
        .attr('opacity', l => connectedLinks.has(l) ? 0.9 : 0.02)
        .attr('stroke', l => connectedLinks.has(l) ? '#475569' : '#94a3b8')
        .attr('stroke-width', l => connectedLinks.has(l) ? 2.5 : 2);

      linkLabels
        .transition()
        .duration(500)
        .attr('opacity', l => connectedLinks.has(l) ? 1 : 0);

      node.transition()
        .duration(500)
        .style('pointer-events', n => connectedNodeIds.has(n.id) ? 'all' : 'none');
    }

    function resetHighlight() {
      node.selectAll('circle')
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .attr('r', d => Math.max(10, Math.sqrt(d.clicks) * 4));

      node.selectAll('text')
        .transition()
        .duration(300)
        .attr('opacity', 1);

      link
        .transition()
        .duration(300)
        .attr('opacity', d => 0.3 + (d.clicks / maxClicks) * 0.7)
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 2);

      linkLabels
        .transition()
        .duration(300)
        .attr('opacity', 0);

      node.style('pointer-events', 'all');
    }

    svg.on('click', (event) => {
      // Only reset if clicking the SVG background, not its children
      if (event.target === svg.node()) {
        isIsolatedRef.current = false;
        setSelectedNode(null);
        setSelectedDimension(null);
        setIsolatedNode(null);
        resetHighlight();
      }
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    window.networkSimulation = { simulation, node, link, linkLabels, nodes, links, maxClicks, showConnections, resetHighlight };

  }, []);

  const handleDimensionClick = (dimension) => {
    if (selectedDimension === dimension) {
      setSelectedDimension(null);
      setSelectedNode(null);
      setIsolatedNode(null);
      isIsolatedRef.current = false;
      if (window.networkSimulation) {
        window.networkSimulation.resetHighlight();
      }
    } else {
      setSelectedDimension(dimension);
      setSelectedNode(null);
      setIsolatedNode(null);
      isIsolatedRef.current = false;
      if (window.networkSimulation) {
        const { node, link, linkLabels, nodes, links } = window.networkSimulation;

        const dimensionNodeIds = new Set(
          nodes.filter(n => n.dimension === dimension).map(n => n.id)
        );

        const connectedLinks = new Set(
          links.filter(l => dimensionNodeIds.has(l.source.id) || dimensionNodeIds.has(l.target.id))
        );

        node.selectAll('circle')
          .transition()
          .duration(500)
          .attr('opacity', n => dimensionNodeIds.has(n.id) ? 1 : 0.1);

        link
          .transition()
          .duration(500)
          .attr('opacity', l => connectedLinks.has(l) ? 0.7 : 0.03);

        linkLabels
          .transition()
          .duration(500)
          .attr('opacity', 0);
      }
    }
  };

  const legendItems = [
    { dimension: 'device_type', color: 'bg-blue-500', label: 'Device Type' },
    { dimension: 'browser_name', color: 'bg-violet-500', label: 'Browser' },
    { dimension: 'campaign', color: 'bg-pink-500', label: 'Campaign' },
    { dimension: 'ref_source', color: 'bg-amber-500', label: 'Ref Source' },
    { dimension: 'link', color: 'bg-emerald-500', label: 'Link' },
    { dimension: 'utm_source', color: 'bg-cyan-500', label: 'UTM Source' },
  ];

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics Network Visualization</h1>
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-semibold">Click</span> nodes to isolate neighborhood ·
            <span className="font-semibold"> Click background</span> to reset ·
            <span className="font-semibold"> Drag</span> to reposition ·
            <span className="font-semibold"> Scroll</span> to zoom
          </p>

          <div className="flex flex-wrap gap-3 mb-4">
            {legendItems.map(item => (
              <button
                key={item.dimension}
                onClick={() => handleDimensionClick(item.dimension)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  selectedDimension === item.dimension
                    ? 'bg-slate-700 ring-2 ring-slate-500 shadow-lg scale-105'
                    : 'bg-white hover:bg-slate-50 hover:shadow-md'
                } cursor-pointer shadow-sm`}
              >
                <div className={`w-4 h-4 rounded-full ${item.color} shadow-md`}></div>
                <span className={`text-xs font-semibold ${
                  selectedDimension === item.dimension ? 'text-white' : 'text-slate-700'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {isolatedNode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
              <span className="font-semibold">Isolated Mode:</span> Showing neighborhood of "{isolatedNode.label}". Click background to exit.
            </div>
          )}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-2xl overflow-hidden relative">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="absolute inset-0"
            onClick={(e) => {
              // Check if clicking the background (not a node)
              if (e.target === e.currentTarget || e.target.tagName === 'svg') {
                isIsolatedRef.current = false;
                setSelectedNode(null);
                setSelectedDimension(null);
                setIsolatedNode(null);
                if (window.networkSimulation) {
                  window.networkSimulation.resetHighlight();
                }
              }
            }}
          ></svg>
        </div>

        {(selectedNode || hoveredNode) && (
          <div className="mt-4 p-5 bg-white rounded-xl shadow-xl border border-slate-200 transition-all duration-300">
            <h3 className="font-bold text-lg text-slate-800 mb-3">
              {(selectedNode || hoveredNode).label}
            </h3>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wide">Dimension</span>
                <p className="font-semibold text-slate-800 mt-1">{(selectedNode || hoveredNode).dimension}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wide">Total Clicks</span>
                <p className="font-semibold text-slate-800 mt-1">{(selectedNode || hoveredNode).clicks}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wide">Records</span>
                <p className="font-semibold text-slate-800 mt-1">{(selectedNode || hoveredNode).records.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsNetworkViz;
```
