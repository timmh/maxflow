import React, { useEffect, useRef, useState } from "react";
import useComponentSize from "@rehooks/component-size";
import "d3-selection-multi";
import FlowGraph, { FlowLink, Node } from "./FlowGraph";
import cytoscape from "cytoscape";
import CytoscapeComponent from "react-cytoscapejs";
import "./react-cytoscapejs.d";
import cola from "cytoscape-cola";
import "./cytoscape-cola.d";
import edgehandles from "cytoscape-edgehandles";
import "./cytoscape-edgehandles.d";
import FontFaceObserver from "fontfaceobserver";

cytoscape.use(cola);
cytoscape.use(edgehandles);

export type Visualisation =
  | {
      type: "HIGHLIGHT_LINK";
      link: FlowLink;
    }
  | {
      type: "HIGHLIGHT_NODE";
      node: Node;
    };

const GraphVisualisation: React.FC<{
  graph: FlowGraph;
  visualisations: Visualisation[];
}> = ({ graph, visualisations }) => {
  const [ready, setReady] = useState(false);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  useEffect(() => {
    new FontFaceObserver("KaTeX_Math").load().then(() => setReady(true));
  }, []);

  useEffect(() => {
    console.log();
    if (!cy || !ready) return;
    const layout = cy.layout({
      name: "cola",
      // @ts-ignore
      animate: false,
      // @ts-ignore
      ungrabifyWhileSimulating: true,
      edgeLength: 150
      // @ts-ignore
      // infinite: true,
      // fit: false
      // ready: () => {
      //   cy && cy.center();
      // }
    });
    layout.run();
    // @ts-ignore
    cy.edgehandles({
      edgeParams: (sourceNode: any, targetNode: any, i: any) => ({
        data: {
          flow: 0,
          capacity: 0
        },
        classes: ["graph-edge"]
      })
    });

    cy.on("tap", function(e) {
      // @ts-ignore
      cy.add([
        {
          group: "nodes",
          data: { label: "X", type: "default" },
          classes: ["graph-node"],
          renderedPosition: {
            x: e.renderedPosition.x,
            y: e.renderedPosition.y
          }
        }
      ]);
    });
  }, [cy, ready]);

  if (!ready) return null;

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

  return (
    <CytoscapeComponent
      elements={[...nodes, ...edges]}
      cy={(nextCy: cytoscape.Core) => {
        if (nextCy !== cy) setCy(nextCy);
      }}
      style={{ width: "600px", height: "600px" }}
      stylesheet={[
        {
          selector: ".graph-node",
          style: {
            width: 40,
            height: 40,
            "text-valign": "center",
            "text-halign": "center",
            "font-family": "KaTeX_Math",
            "background-color": "white",
            "border-width": 3,
            "border-color": "black",
            content: (node: any) => `${node.data("label")}`
            // "background-color": (node: Node) =>
            //   // @ts-ignore
            //   node.data().type === "sink" ? "green" : "red"
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
                : undefined
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
      ]}
    />
  );
};

export default GraphVisualisation;
