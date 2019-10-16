import React, { useRef, useEffect } from "react";
import useComponentSize from "@rehooks/component-size";
import * as d3 from "d3";
import "d3-selection-multi";
import FlowGraph from "./FlowGraph";
import { forceSimulation } from "d3-force";

const GraphVisualisation: React.FC<{ graph: FlowGraph }> = ({ graph }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useComponentSize(containerRef);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    const { width, height } = containerSize;

    const sizeFactor = 2;
    const nodeRadius = 25;
    const arrowRadiusFactor = 0.5;
    const arrowColor = "#000000";
    const backgroundColor = "#FFFFFF";
    const linkLabelSize = 10;
    const nodeDistance = 200;

    const simulation =
      // @ts-ignore
      forceSimulation(graph.nodes)
        .force(
          "link",
          d3
            .forceLink(graph.links)
            // @ts-ignore
            .id(d => d.id)
            .distance(nodeDistance)
            .strength(1)
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(nodeRadius * 2));

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
      .attr("fill", arrowColor)
      .style("stroke", "none");

    const links = svg
      .append("g")
      .attr("class", "link")
      .attr("stroke", arrowColor)
      .selectAll(".link")
      .data(graph.links)
      .join("line")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrowhead)");

    const linkLabels = svg
      .selectAll(".link-label")
      .data(graph.links)
      .enter()
      .append("g");

    linkLabels
      .append("text")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "central")
      .attr("font-size", linkLabelSize)
      .attr("fill", backgroundColor)
      .attr("stroke", backgroundColor)
      .attr("stroke-width", linkLabelSize)
      .text(d => `${d.flow} / ${d.capacity}`);
    linkLabels
      .append("text")
      .style("text-anchor", "middle")
      .style("dominant-baseline", "central")
      .attr("font-size", linkLabelSize)
      .attr("fill", arrowColor)
      .text(d => `${d.flow} / ${d.capacity}`);

    const nodes = svg
      .selectAll(".node")
      .data(graph.nodes)
      .enter()
      .append("g");

    const circles = nodes
      .append("circle")
      .attr("class", "node")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("r", nodeRadius);
    const labels = nodes
      .append("text")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("font-family", "sans-serif")
      .attr("font-size", 24)
      .style("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("cursor", "default")
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
        .attrs(({ source, target }) => {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const a = Math.atan2(dx, dy);
          const ox = Math.cos(a) * arrowRadiusFactor * nodeRadius;
          const oy = -Math.sin(a) * arrowRadiusFactor * nodeRadius;

          return {
            x1: source.x + ox,
            y1: source.y + oy,
            x2: target.x + ox,
            y2: target.y + oy
          };
        });
      linkLabels
        // @ts-ignore
        .attrs(({ source, target }) => {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const a = Math.atan2(dx, dy);
          const ox = Math.cos(a) * arrowRadiusFactor * nodeRadius;
          const oy = -Math.sin(a) * arrowRadiusFactor * nodeRadius;

          return {
            transform: `translate(${source.x + dx / 2 + ox}, ${source.y +
              dy / 2 +
              oy})`
          };
        });

      // @ts-ignore
      nodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
    });

    // simulation.restart();
  }, [graph, containerRef, containerSize]);

  return <div className="graph-visualisation" ref={containerRef} />;
};

export default GraphVisualisation;
