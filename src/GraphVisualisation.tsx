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
      edgeLength: 3 * nodeSize
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
          : "flat",
      complete: (sourceNode: any, targetNode: any, addedEles: any) => {
        // console.log(addedEles);
        // // @ts-ignore
        // addedEls.forEach(addedEle => addedEle.removeClass("eh-preview"));
      }
    });

    cy.on("tap", evt => {
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

    // cy.on("tap", ".graph-node", evt => {
    //   // @ts-ignore
    //   evt.target.remove();
    // });

    // cy.on("tap", ".graph-edge", evt => {
    //   // @ts-ignore
    //   evt.target.remove();
    // });

    // @ts-ignore
    cy.cxtmenu({
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
    cy.cxtmenu({
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
      className="graph-visualisation"
      // style={{ width: "600px", height: "600px" }}
      stylesheet={[
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
      ]}
    />
  );
};

export default GraphVisualisation;
