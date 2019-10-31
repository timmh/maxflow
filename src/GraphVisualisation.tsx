import React, { useEffect, useRef, useState } from "react";
import useComponentSize from "@rehooks/component-size";
import "d3-selection-multi";
import FlowGraph, { FlowLink, Node } from "./FlowGraph";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
import "./cytoscape-cola.d";
import edgehandles from "cytoscape-edgehandles";
import "./cytoscape-edgehandles.d";
import FontFaceObserver from "fontfaceobserver";
import cxtmenu from "cytoscape-cxtmenu";
import Swal from "sweetalert2";

cytoscape.use(cola);
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

const nodeSize = 50;

export type Visualisation =
  | {
      type: "HIGHLIGHT_LINK";
      link: FlowLink;
    }
  | {
      type: "HIGHLIGHT_NODE";
      node: Node;
    };

export interface VisRef {
  cy: cytoscape.Core;
}

const GraphVisualisation: React.FC<{
  graph: FlowGraph;
  visRef: (visRef: VisRef) => void;
  disableInteraction: boolean;
}> = ({ graph, visRef, disableInteraction }) => {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  let [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [cyMenus, setCyMenus] = useState([]);
  const [cyEdgehandles, setCyEdgehandles] = useState(null);
  const graphVisualisationRef = useRef<VisRef | null>(null);
  useEffect(() => {
    new FontFaceObserver("KaTeX_Math").load().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const nodes = graph.nodes.map(node => ({
      group: "nodes",
      data: { id: node.id, label: node.title, type: node.type },
      classes: ["graph-node"]
    }));
    const edges = graph.links.map(edge => ({
      group: "edges",
      data: {
        source: edge.source.id,
        target: edge.target.id,
        flow: edge.flow,
        capacity: edge.capacity
      },
      classes: ["graph-edge"]
    }));

    // @ts-ignore
    cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: ".graph-node",
          style: {
            width: nodeSize,
            height: nodeSize,
            "text-valign": "center",
            "text-halign": "center",
            "font-family": "KaTeX_Math",
            // "background-color": "white",
            "border-width": 3,
            "border-color": "black",
            content: (node: any) => `${node.data("label")}`,
            "background-color": (node: any) =>
              node.data().type === "source"
                ? "green"
                : node.data().type === "sink"
                ? "red"
                : "white"
          }
        },
        {
          selector: ".graph-edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "line-color": "black",
            "target-arrow-color": "black",
            "text-background-color": "white",
            "text-background-opacity": 1,
            "text-background-shape": "roundrectangle",
            "text-background-padding": 0,
            "font-family": "KaTeX_Math",
            "font-size": 12,
            content: (edge: any) =>
              typeof edge.data("flow") === "number" &&
              typeof edge.data("capacity") === "number"
                ? ` ${edge.data("flow")}/${edge.data("capacity")} `
                : ""
          }
        },
        {
          selector: ".eh-handle",
          style: {
            "background-color": "red",
            width: 12,
            height: 12,
            shape: "ellipse",
            "overlay-opacity": 0,
            "border-width": 12, // makes the handle easier to hit
            "border-opacity": 0
          }
        },
        {
          selector: ".eh-hover",
          style: {
            "background-color": "red"
          }
        },
        {
          selector: ".eh-source",
          style: {
            "border-width": 2,
            "border-color": "red"
          }
        },
        {
          selector: ".eh-target",
          style: {
            "border-width": 2,
            "border-color": "red"
          }
        },
        {
          selector: ".eh-preview, .eh-ghost-edge",
          style: {
            "background-color": "red",
            "line-color": "red",
            "target-arrow-color": "red",
            "source-arrow-color": "red"
          }
        },
        {
          selector: ".eh-ghost-edge.eh-preview-active",
          style: {
            opacity: 0
          }
        }
      ]
    });

    if (!cy) return;

    const layout = cy.layout({
      name: "cola",
      // @ts-ignore
      animate: false,
      // @ts-ignore
      ungrabifyWhileSimulating: true,
      edgeLength: 3 * nodeSize
    });
    layout.run();
    // @ts-ignore
    const edgehandles = cy.edgehandles({
      preview: false,
      handleNodes: ".graph-node",
      edgeParams: (sourceNode: any, targetNode: any, i: any) => ({
        data: {
          flow: 0,
          capacity: 0
        },
        classes: ["graph-edge"]
      }),
      edgeType: (sourceNode: any, targetNode: any) =>
        sourceNode.outgoers().intersection(targetNode).length > 0
          ? null
          : "flat"
    });

    setCyEdgehandles(edgehandles);

    cy.on("tap", (evt: cytoscape.EventObject) => {
      if (evt.target !== cy) return; // only handle taps on background
      // @ts-ignore
      cy.add([
        {
          group: "nodes",
          data: { label: "X", type: "default" },
          classes: ["graph-node"],
          renderedPosition: {
            x: evt.renderedPosition.x,
            y: evt.renderedPosition.y
          }
        }
      ]);
    });
    enableMenus();
    setCy(cy);
    const nextGraphVisualisationRef: VisRef = { cy };
    if (!graphVisualisationRef.current) {
      graphVisualisationRef.current = nextGraphVisualisationRef;
    } else {
      Object.assign(graphVisualisationRef.current, nextGraphVisualisationRef);
    }
    if (graphVisualisationRef.current) visRef(graphVisualisationRef.current);
  }, [ready, containerRef.current]);

  const enableMenus = () => {
    // @ts-ignore
    const nodeMenu = cy.cxtmenu({
      menuRadius: 2 * nodeSize,
      selector: ".graph-node",
      commands: [
        {
          content: "Remove",
          select: (node: cytoscape.NodeSingular) => node.remove()
        },
        {
          content: "Rename",
          select: async (node: cytoscape.NodeSingular) => {
            const { value } = await Swal.fire({
              input: "text",
              inputValue: node.data("label"),
              title: "Rename",
              showCancelButton: true
            });
            if (value) node.data("label", value);
          }
        },
        {
          content: "Change Type",
          select: async (node: cytoscape.NodeSingular) => {
            const { value } = await Swal.fire({
              title: "Change Type",
              input: "select",
              inputOptions: {
                default: "Default",
                source: "Source",
                sink: "Sink"
              },
              inputValue: node.data("type"),
              showCancelButton: true
            });
            if (value) node.data("type", value);
          }
        }
      ]
    });

    // @ts-ignore
    const edgeMenu = cy.cxtmenu({
      menuRadius: 2 * nodeSize,
      selector: ".graph-edge",
      commands: [
        {
          content: "Remove",
          select: (edge: cytoscape.EdgeSingular) => edge.remove()
        },
        {
          content: "Change Capacity",
          select: async (edge: cytoscape.EdgeSingular) => {
            let { value } = await Swal.fire({
              input: "number",
              inputValue: edge.data("capacity"),
              title: "Change Capacity",
              showCancelButton: true
            });
            value = parseInt(value, 10);
            edge.data("capacity", value);
          }
        }
      ]
    });

    // @ts-ignore
    setCyMenus([nodeMenu, edgeMenu]);
  };

  useEffect(() => {
    if (!cy) return;
    if (disableInteraction) {
      cy.nodes().ungrabify();
      // @ts-ignore
      cyMenus.forEach(menu => menu.destroy());
      // @ts-ignore
      cyEdgehandles.disable();
    } else {
      enableMenus();
      cy.nodes().grabify();
      // @ts-ignore
      cyEdgehandles.enable();
    }
  }, [disableInteraction]);

  if (!ready) return null;

  return <div ref={containerRef} className="graph-visualisation" />;
};

export default GraphVisualisation;
