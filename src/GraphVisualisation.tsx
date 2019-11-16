import React, { useEffect, useRef, useState } from "react";
import "d3-selection-multi";
import cytoscape, { EdgeSingular } from "cytoscape";
import cola from "cytoscape-cola";
import "./cytoscape-cola.d";
import edgehandles from "cytoscape-edgehandles";
import "./cytoscape-edgehandles.d";
import FontFaceObserver from "fontfaceobserver";
import cxtmenu from "cytoscape-cxtmenu";
import Swal from "sweetalert2";
import defaultHash from "./utils/defaultHash";
import * as styleVariables from "./variables.scss";
import { cyto2tgf, tgf2cyto } from "./utils/io";

cytoscape.use(cola);
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);

const nodeSize = 50;

export interface VisRef {
  cy: cytoscape.Core;
  layout: cytoscape.Layouts;
  edgehandles: any;
  resetLayout: () => void;
}

const graphToHash = (cy: cytoscape.Core) => {
  return `#${encodeURIComponent(cyto2tgf(cy))}`;
};

const hashToGraph = (hash: string) => {
  if (!hash.startsWith("#")) throw new Error("invalid hash");
  const cyto = tgf2cyto(decodeURIComponent(hash.substr(1)));
  return [...cyto.nodes, ...cyto.edges];
};

// TODO: still not correct after Z
const getNewNodeLabel = (cy: cytoscape.Core) =>
  String.fromCharCode(
    "A".charCodeAt(0) + Math.random() * ("Z".charCodeAt(0) - "A".charCodeAt(0))
  );

interface GraphVisualisationProps {
  visRef: (visRef: VisRef) => void;
  disableInteraction: boolean;
  autoLayout: boolean;
}

const GraphVisualisation: React.FC<GraphVisualisationProps> = props => {
  const { visRef, disableInteraction, autoLayout } = props;
  const currentPropsRef = useRef<GraphVisualisationProps | null>(null);
  currentPropsRef.current = props;
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  let [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [cyMenus, setCyMenus] = useState([]);
  const [cyEdgehandles, setCyEdgehandles] = useState(null);
  const graphVisualisationRef = useRef<VisRef | null>(null);
  const interactionDisabled = useRef<boolean>(false);
  interactionDisabled.current = disableInteraction;
  useEffect(() => {
    new FontFaceObserver("KaTeX_Math").load().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    // @ts-ignore
    cy = cytoscape({
      elements: hashToGraph(window.location.hash || defaultHash),
      container: containerRef.current,
      boxSelectionEnabled: false,
      minZoom: 0.5,
      maxZoom: 5,
      style: [
        {
          selector: ".graph-node",
          style: {
            width: nodeSize,
            height: nodeSize,
            content: (node: any) => `${node.data("label")}`,
            "text-valign": "center",
            "text-halign": "center",
            "font-family": "KaTeX_Math",
            // "background-color": "white",
            "border-width": 3,
            "border-color": "black",
            "border-style": (node: any) =>
              node.data().type === "source"
                ? "double"
                : node.data().type === "sink"
                ? "dashed"
                : "solid",
            "background-color": "white"
          }
        },
        {
          selector: ".graph-node.highlighted",
          style: {
            "border-color": styleVariables.colorHighlight
          }
        },
        {
          selector: ".graph-edge",
          style: {
            "target-arrow-shape": "triangle",
            "line-color": "black",
            "target-arrow-color": "black",
            "text-background-color": "white",
            "text-background-opacity": 1,
            "text-background-shape": "roundrectangle",
            "text-background-padding": 0,
            "font-family": "KaTeX_Math",
            "font-size": 12,
            content: (edge: EdgeSingular) =>
              typeof edge.data("flow") === "number" &&
              typeof edge.data("capacity") === "number"
                ? ` ${edge.data("flow")}/${edge.data("capacity")} `
                : "",
            "curve-style": (edge: EdgeSingular) =>
              !interactionDisabled.current ||
              edge
                .parallelEdges()
                .difference(edge.codirectedEdges())
                .filter(otherEdge => otherEdge.data("capacity") > 0).length > 0
                ? "bezier"
                : "straight",
            visibility: (edge: EdgeSingular) =>
              edge.data("capacity") <= 0 && interactionDisabled.current
                ? "hidden"
                : "visible"
          }
        },
        {
          selector: ".graph-edge.highlighted",
          style: {
            "line-color": styleVariables.colorHighlight,
            "target-arrow-color": styleVariables.colorHighlight
          }
        },
        {
          selector: ".eh-handle",
          style: {
            "background-color": styleVariables.colorHandles,
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
            "background-color": styleVariables.colorHandles
          }
        },
        {
          selector: ".eh-source",
          style: {
            "border-width": 2,
            "border-color": styleVariables.colorHandles
          }
        },
        {
          selector: ".eh-target",
          style: {
            "border-width": 2,
            "border-color": styleVariables.colorHandles
          }
        },
        {
          selector: ".eh-preview, .eh-ghost-edge",
          style: {
            "background-color": styleVariables.colorHandles,
            "line-color": styleVariables.colorHandles,
            "target-arrow-color": styleVariables.colorHandles,
            "source-arrow-color": styleVariables.colorHandles
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

    // @ts-ignore
    let layout: cytoscape.Layouts = null;
    const resetLayout = () => {
      if (layout !== null) {
        layout.stop();
      }
      layout = cy!.layout({
        name: "cola",
        // @ts-ignore
        // animate: false,
        // @ts-ignore
        // ungrabifyWhileSimulating: true,
        edgeLength: 3 * nodeSize,
        randomize: false,
        infinite: true,
        fit: false,
        handleDisconnected: false
      });
      layout.run();
    };
    resetLayout();

    // @ts-ignore
    const edgehandles = cy.edgehandles({
      preview: false,
      handleNodes: ".graph-node",
      edgeParams: (sourceNode: any, targetNode: any, i: any) => ({
        data: {
          flow: 0,
          capacity: 0
        },
        classes: "graph-edge"
      }),
      edgeType: (sourceNode: any, targetNode: any) =>
        sourceNode.outgoers().intersection(targetNode).length > 0
          ? null
          : "flat",
      complete: (a: any, b: any, addedEles: any) => {
        addedEles
          .filter((element: any) => element.hasClass("graph-edge"))
          .forEach((edge: any) => {
            if (
              cy!
                .edges(".graph-edges")
                .filter(
                  otherEdge =>
                    otherEdge.data("source") === edge.data("target") &&
                    otherEdge.data("target") === edge.data("source")
                ).length === 0
            ) {
              cy!.add({
                data: {
                  source: edge.data("target"),
                  target: edge.data("source"),
                  flow: 0,
                  capacity: 0
                },
                group: "edges",
                classes: "graph-edge"
              });
            }
          });
        resetLayout();
      }
    });

    setCyEdgehandles(edgehandles);

    cy.on("mouseover", ".graph-node", evt => {
      layout.stop();
    });

    cy.on("mouseout", ".graph-node", evt => {
      if (currentPropsRef.current!.autoLayout) layout.start();
    });

    cy.on("tap", evt => {
      if (!cy || evt.target !== cy || interactionDisabled.current) return; // only handle taps on background
      // @ts-ignore
      cy.add([
        {
          group: "nodes",
          data: { label: getNewNodeLabel(cy), type: "default" },
          classes: "graph-node",
          renderedPosition: {
            x: evt.renderedPosition.x,
            y: evt.renderedPosition.y
          }
        }
      ]);
      resetLayout();
    });

    cy.on("add remove data", ".graph-node, .graph-edge", () => {
      if (!cy || interactionDisabled.current) return;

      const exp = graphToHash(cy);
      // @ts-ignore
      if (window.history.pushState) {
        window.history.replaceState(null, document.title, exp);
      } else {
        window.location.hash = exp;
      }
    });

    enableMenus();
    setCy(cy);
    const nextGraphVisualisationRef: VisRef = {
      cy,
      layout,
      resetLayout,
      edgehandles
    };
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
          content: "Reverse",
          select: (edge: cytoscape.EdgeSingular) => {
            const reverseEdge = edge
              .parallelEdges()
              .difference(edge.codirectedEdges())[0] as EdgeSingular;
            const edgeCapacity = edge.data("capacity");
            edge.data("capacity", reverseEdge.data("capacity"));
            reverseEdge.data("capacity", edgeCapacity);
          }
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
            if (!isNaN(value)) edge.data("capacity", value);
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
    // @ts-ignore
    cy.style().update();
  }, [disableInteraction]);

  useEffect(() => {
    if (!graphVisualisationRef.current) return;
    if (!autoLayout) {
      graphVisualisationRef.current.layout.stop();
    } else {
      graphVisualisationRef.current.layout.start();
    }
  }, [graphVisualisationRef.current, autoLayout]);

  if (!ready) return null;

  return <div ref={containerRef} className="graph-visualisation" />;
};

export default GraphVisualisation;
