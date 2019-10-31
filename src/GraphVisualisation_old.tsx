import React, { useRef, useEffect } from "react";
import useComponentSize from "@rehooks/component-size";
import * as d3 from "d3";
import "d3-selection-multi";
import FlowGraph, { FlowLink, Node } from "./FlowGraph";
import { forceSimulation } from "d3-force";

export type Visualisation =
  | {
      type: "HIGHLIGHT_LINK";
      link: FlowLink;
    }
  | {
      type: "HIGHLIGHT_NODE";
      node: Node;
    };

const nodeRadius = 25;
const arrowRadiusFactor = 0.5;
const linkColor = "#000000";
const backgroundColor = "#FFFFFF";
const linkLabelSize = 10;
const nodeDistance = 200;
const highlightColor = "gold";

const GraphVisualisation: React.FC<{
  graph: FlowGraph;
  visualisations: Visualisation[];
}> = ({ graph, visualisations }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useComponentSize(containerRef);
  const { width, height } = containerSize;
  const el = containerRef.current;

  useEffect(() => {
    if (!el) return;
    el.innerHTML = "";

    const svg = d3
      .select(el)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const defs = svg.append("defs");

    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", nodeRadius * Math.sin(Math.PI * arrowRadiusFactor))
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 13)
      .attr("markerHeight", 13)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", linkColor)
      .style("stroke", "none");

    defs
      .append("marker")
      .attr("id", "arrowhead-highlighted")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", nodeRadius * Math.sin(Math.PI * arrowRadiusFactor))
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 13)
      .attr("markerHeight", 13)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", highlightColor)
      .style("stroke", "none");
  }, [el, width, height]);

  useEffect(() => {
    if (!el) return;
    const svg = d3.select(el).select("svg");

    const highlightedNodes = visualisations.map(v =>
      v.type === "HIGHLIGHT_NODE" ? v.node : null
    );

    const highlightedLinks = visualisations.map(v =>
      v.type === "HIGHLIGHT_LINK" ? v.link : null
    );

    const simulation =
      // @ts-ignore
      forceSimulation(graph.nodes)
        .force(
          "link",
          d3
            // @ts-ignore
            .forceLink(graph.links)
            // @ts-ignore
            .id(d => d.id)
            .distance(nodeDistance)
            .strength(100)
        )
        // .force("charge", d3.forceManyBody().strength(-1))
        .force("center", d3.forceCenter(width / 2, height / 2))
        // .force("x", d3.forceX(width / 2).strength(0.001))
        // .force("y", d3.forceY(height / 2).strength(0.001))
        .force("collision", d3.forceCollide().radius(nodeRadius * 3));

    const links = svg.selectAll(".link").data(graph.links);

    links
      .enter()
      .append("line")
      .attr("class", "link");

    links
      .attr("stroke", d =>
        highlightedLinks.includes(d) ? highlightColor : linkColor
      )
      .attr("stroke-width", 1)
      .attr("marker-end", d =>
        highlightedLinks.includes(d)
          ? "url(#arrowhead-highlighted)"
          : "url(#arrowhead)"
      );

    // const linkLabels = svg.selectAll(".link-label").data(graph.links);

    // linkLabels.exit().remove();

    // const linkLabelGroupsEnter = linkLabels
    //   .enter()
    //   .append("g")
    //   .attr("class", "link-label");

    // linkLabelGroupsEnter
    //   .append("text")
    //   .style("text-anchor", "middle")
    //   .style("dominant-baseline", "central")
    //   .attr("font-size", linkLabelSize)
    //   .attr("fill", backgroundColor)
    //   .attr("stroke", backgroundColor)
    //   .attr("stroke-width", linkLabelSize)
    //   .text(d => `${d.flow}/${d.capacity}`);
    // linkLabelGroupsEnter
    //   .append("text")
    //   .style("text-anchor", "middle")
    //   .style("dominant-baseline", "central")
    //   .attr("font-size", linkLabelSize)
    //   .attr("fill", linkColor)
    //   .text(d => `${d.flow}/${d.capacity}`);

    const linkLabels = svg.selectAll(".link-label").data(graph.links);

    linkLabels.exit().remove();
    const linkLabelsEnter = linkLabels
      .enter()
      .append("g")
      .attr("class", "link-label");
    linkLabelsEnter.append("text").attr("class", "link-label-background");

    linkLabels
      .selectAll(".link-label-background")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "central")
      .attr("font-size", linkLabelSize)
      .attr("fill", backgroundColor)
      .attr("stroke", backgroundColor)
      .attr("stroke-width", linkLabelSize)
      // @ts-ignore
      .text(d => `${d.flow}/${d.capacity}`);

    linkLabelsEnter.append("text").attr("class", "link-label-foreground");
    linkLabels
      .selectAll(".link-label-foreground")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "central")
      .attr("font-size", linkLabelSize)
      .attr("fill", linkColor)
      // @ts-ignore
      .text(d => `${d.flow}/${d.capacity}`);

    const nodes = svg.selectAll(".node").data(graph.nodes);
    const nodesEnter = nodes
      .enter()
      .append("g")
      .attr("class", "node");

    nodesEnter.append("circle").attr("class", "node-circle");
    nodesEnter.append("text").attr("class", "node-label");

    nodes
      .selectAll(".node-circle")
      .attr("cx", 0)
      .attr("cy", 0)
      // @ts-ignore
      .attr("fill", d =>
        // @ts-ignore
        highlightedNodes.includes(d) ? highlightColor : backgroundColor
      )
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("r", nodeRadius);
    nodes
      .selectAll(".node-label")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("font-family", "sans-serif")
      .attr("font-size", 24)
      .style("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("cursor", "default")
      // @ts-ignore
      .text(d => `${d.title}`);

    nodes.call(
      // @ts-ignore
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    // @ts-ignore
    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    // @ts-ignore
    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    // @ts-ignore
    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // let settleForceIterations = 0;
    // while (simulation.alpha() > 0.01) {
    //   simulation.tick();
    //   if (settleForceIterations > 500) {
    //     break;
    //   }
    //   settleForceIterations++;
    // }

    simulation.on("tick", () => {
      links
        // @ts-ignore
        .attrs(d => {
          const source = graph.getNode(d.source.id);
          const target = graph.getNode(d.target.id);
          // @ts-ignore
          const dx = target.x - source.x;
          // @ts-ignore
          const dy = target.y - source.y;
          const a = Math.atan2(dx, dy);
          const ox = Math.cos(a) * arrowRadiusFactor * nodeRadius;
          const oy = -Math.sin(a) * arrowRadiusFactor * nodeRadius;

          return {
            // @ts-ignore
            x1: source.x + ox,
            // @ts-ignore
            y1: source.y + oy,
            // @ts-ignore
            x2: target.x + ox,
            // @ts-ignore
            y2: target.y + oy
          };
        });
      linkLabels
        // @ts-ignore
        .attrs(d => {
          const source = graph.getNode(d.source.id);
          const target = graph.getNode(d.target.id);
          // @ts-ignore
          const dx = target.x - source.x;
          // @ts-ignore
          const dy = target.y - source.y;
          const a = Math.atan2(dx, dy);
          const ox = Math.cos(a) * arrowRadiusFactor * nodeRadius;
          const oy = -Math.sin(a) * arrowRadiusFactor * nodeRadius;

          return {
            // @ts-ignore
            transform: `translate(${source.x + dx / 2 + ox}, ${source.y +
              dy / 2 +
              oy})`
          };
        });

      // @ts-ignore
      nodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // simulation.restart();
  }, [graph, containerRef, containerSize, visualisations, el, width, height]);

  return <div className="graph-visualisation" ref={containerRef} />;
};

export default GraphVisualisation;
