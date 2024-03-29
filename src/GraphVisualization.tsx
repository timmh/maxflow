import React from "react";
import cytoscape, {
  EdgeSingular,
  NodeSingular,
  EdgeCollection
} from "cytoscape";
import cola from "cytoscape-cola";
import edgehandles from "cytoscape-edgehandles";
import FontFaceObserver from "fontfaceobserver";
import cxtmenu from "cytoscape-cxtmenu";
import Swal from "sweetalert2";
import defaultHash from "./utils/defaultHash";
import styleVariables from "./variables.scss";
import {
  cyto2tgf,
  tgf2cyto,
  urlSafeBase64Encode,
  urlSafeBase64Decode
} from "./utils/io";
import { GraphDisplayState } from "./GraphControls";
import nodeHtmlLabel from "cytoscape-node-html-label";

cytoscape.use(cola);
cytoscape.use(edgehandles);
cytoscape.use(cxtmenu);
nodeHtmlLabel(cytoscape);

const graphToHash = (cy: cytoscape.Core) =>
  `#${encodeURIComponent(urlSafeBase64Encode(cyto2tgf(cy)))}`;

const hashToGraph = (hash: string) => {
  if (!hash.startsWith("#")) throw new Error("invalid hash");
  const base64 = decodeURIComponent(hash.slice(1));
  const tgf = urlSafeBase64Decode(base64);
  const cyto = tgf2cyto(tgf);
  return cyto;
};

const getNewNodeLabel = () =>
  String.fromCharCode(
    "a".charCodeAt(0) + Math.random() * ("z".charCodeAt(0) - "a".charCodeAt(0))
  );

interface GraphVisualizationProps {
  visualizationRef?: (visualizationRef: GraphVisualization) => void;
  disableInteraction: boolean;
  autoLayout: boolean;
  graphDisplayState: GraphDisplayState;
  onChange?: () => void;
}

interface GraphVisualizationState {
  interactionDisabled: boolean;
  layoutRunning: boolean;
}

class GraphVisualization extends React.Component<
  GraphVisualizationProps,
  GraphVisualizationState
  > {
  container: HTMLDivElement | null = null;
  cy: cytoscape.Core | null = null;
  layout: cytoscape.Layouts | null = null;
  edgehandles: any = null;
  menus: { [key: string]: any } = {};
  readyPromise: Promise<void>;

  constructor(props: GraphVisualizationProps) {
    super(props);
    this.state = GraphVisualization.getDerivedStateFromProps(props, {});
    this.readyPromise = new FontFaceObserver("KaTeX_Math").load();
  }

  getEdgeLabel = (edge: EdgeSingular) => {
    if (
      typeof edge.data("flow") !== "number" ||
      typeof edge.data("capacity") !== "number"
    ) {
      return "";
    }
    const { graphDisplayState } = this.props;
    if (graphDisplayState === "flow") {
      return `${edge.data("flow")}/${edge.data("capacity")}`;
    } else if (graphDisplayState === "residual") {
      return `${edge.data("capacity") - edge.data("flow")}`;
    } else if (graphDisplayState === "original_flow") {
      return `${0}/${edge.data("capacity")}`;
    }
    return "";
  };

  getEdgeCurveStyle = (edge: EdgeSingular) => {
    return edge
      .parallelEdges()
      .difference(edge.codirectedEdges())
      .filter(
        otherEdge =>
          this.getEdgeVisibility(otherEdge as EdgeSingular) === "visible"
      ).length > 0
      ? "bezier"
      : "straight";
  };

  getEdgeVisibility = (edge: EdgeSingular) => {
    if (
      typeof edge.data("flow") !== "number" ||
      typeof edge.data("capacity") !== "number"
    ) {
      return "hidden";
    }
    const { graphDisplayState } = this.props;
    const { interactionDisabled } = this.state;
    if (graphDisplayState === "flow") {
      return interactionDisabled &&
        edge.data("capacity") === 0 &&
        edge.data("flow") === 0
        ? "hidden"
        : "visible";
    } else if (graphDisplayState === "residual") {
      return edge.data("capacity") - edge.data("flow") === 0
        ? "hidden"
        : "visible";
    } else if (graphDisplayState === "original_flow") {
      return "visible";
    }
    return "visible";
  };

  getHighlightColor = () => {
    if (this.props.graphDisplayState === "original_flow") {
      return styleVariables.colorBlack;
    } else {
      return styleVariables.colorHighlight;
    }
  };

  restyle = () => {
    if (!this.cy) return;
    // the following line fixes some edge rendering issue with cytoscape.js
    // @ts-ignore
    this.cy.style().clear().update();
    // @ts-ignore
    this.cy.style(this.getStyle());
  };

  getStyle = () => [
    {
      selector: ".graph-node",
      style: {
        width: styleVariables.nodeSize,
        height: styleVariables.nodeSize,
        "text-valign": "center",
        "text-halign": "center",
        "font-family": "KaTeX_Math",
        "border-width": 3,
        "border-color": styleVariables.colorBlack,
        "border-style": (node: NodeSingular) =>
          node.data().type === "source"
            ? "double"
            : node.data().type === "sink"
              ? "dashed"
              : "solid",
        "background-color": "white",
        "transition-property": "border-color",
        "transition-duration": styleVariables.stepTransitionDuration,
        "transition-timing-function": "ease"
      }
    },
    {
      selector: ".graph-node.highlighted",
      style: {
        "border-color": () => this.getHighlightColor()
      }
    },
    {
      selector: ".graph-edge",
      style: {
        "target-arrow-shape": "triangle",
        color: styleVariables.colorBlack,
        "line-color": styleVariables.colorBlack,
        "target-arrow-color": styleVariables.colorBlack,
        "text-background-color": "white",
        "text-background-opacity": 1,
        "text-background-shape": "roundrectangle",
        "font-family": "KaTeX_Math",
        "font-size": 12,
        label: (edge: EdgeSingular | NodeSingular) =>
          this.getEdgeLabel(edge as EdgeSingular),
        "curve-style": (edge: EdgeSingular | NodeSingular) =>
          this.getEdgeCurveStyle(edge as EdgeSingular),
        visibility: (edge: EdgeSingular | NodeSingular) =>
          this.getEdgeVisibility(edge as EdgeSingular) as "none" | "visible",
        "transition-property": "line-color, target-arrow-color",
        "transition-duration": styleVariables.stepTransitionDuration,
        "transition-timing-function": "ease"
      }
    },
    {
      selector: ".graph-edge.highlighted",
      style: {
        "line-color": () => this.getHighlightColor(),
        "target-arrow-color": () => this.getHighlightColor()
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
        "border-width": 12,
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
        "border-color": styleVariables.colorHandles
      }
    },
    {
      selector: ".eh-target",
      style: {
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
  ];

  reset = () => {
    if (!this.container) return;
    if (this.cy) {
      this.cy.destroy();
    }
    this.container.innerHTML = "";

    let elementsFromUrl = hashToGraph(defaultHash);
    if (window.location.hash) {
      try {
        elementsFromUrl = hashToGraph(window.location.hash);
      } catch (err) {
        Swal.fire(
          "Error",
          "Unable to read graph from URL. The default graph was loaded.",
          "error"
        );
      }
    }

    // @ts-ignore
    this.cy = cytoscape({
      elements: elementsFromUrl,
      container: this.container,
      boxSelectionEnabled: false,
      minZoom: 0.5,
      maxZoom: 5,
      wheelSensitivity: 0.1,
      // @ts-ignore
      style: this.getStyle()
    });

    // @ts-ignore
    this.cy.nodeHtmlLabel([
      {
        query: ".graph-node",
        fontFamily: "KaTeX_Math",
        tpl: (data: any) => {
          const hasMetadata =
            typeof data.height === "number" || typeof data.excess === "number";

          return `
          <div style="
            font-family: KaTeX_Math;
            text-align: center;
            line-height: 12px;
          " class="cytoscape-html-node-label-${data.id}">
          <div style="font-size: ${hasMetadata ? 12 : 16}px;">${
            data.label
            }</div>
          ${
            typeof data.height === "number"
              ? `<div style="font-size: 10px;">h=${data.height}</div>`
              : ""
            }
          ${
            typeof data.excess === "number"
              ? `<div  style="font-size: 10px;">e=${data.excess}</div>`
              : ""
            }
          </div>
        `;
        }
      }
    ]);

    this.cy!.on("add remove data", ".graph-node, .graph-edge", () => {
      // @ts-ignore
      this.restyle();

      if (!this.cy || this.state.interactionDisabled) return;

      if (this.props.onChange) this.props.onChange();

      const exp = graphToHash(this.cy);
      // @ts-ignore
      if (window.history.pushState) {
        window.history.replaceState(null, document.title, exp);
      } else {
        window.location.hash = exp;
      }
    });

    // TODO: find out why this is necessary and remove
    this.cy!.on("remove", ".graph-node", evt => {
      const id = evt.target.id();
      setTimeout(() => {
        Array.from(
          document.querySelectorAll(`.cytoscape-html-node-label-${id}`)
        ).forEach(el => {
          el.remove();
        });
      }, 100);
    });

    this.cy!.on("restyle", () => {
      this.restyle();
    });

    this.resetLayout();
    if (!this.state.interactionDisabled) this.enableMenus();

    // @ts-ignore
    this.edgehandles = this.cy.edgehandles({
      preview: false,
      handleNodes: ".graph-node",
      hideHandleOnSourceNodeMove: false,
      edgeParams: () => ({
        data: {
          flow: 0,
          capacity: 0
        },
        classes: "graph-edge"
      }),
      edgeType: (sourceNode: NodeSingular, targetNode: NodeSingular) =>
        sourceNode.outgoers().intersection(targetNode).length > 0
          ? null
          : "flat",
      complete: (
        sourceNode: NodeSingular,
        targetNode: NodeSingular,
        addedEles: EdgeCollection
      ) => {
        addedEles
          .filter((element: any) => element.hasClass("graph-edge"))
          .forEach((edge: any) => {
            if (
              this.cy!.edges(".graph-edges").filter(
                otherEdge =>
                  otherEdge.data("source") === edge.data("target") &&
                  otherEdge.data("target") === edge.data("source")
              ).length === 0
            ) {
              this.cy!.add({
                data: {
                  source: edge.data("target"),
                  target: edge.data("source"),
                  flow: 0,
                  capacity: 1
                },
                group: "edges",
                classes: "graph-edge"
              });
            }
          });
        this.restyle();
        this.resetLayout();
      }
    });

    if (this.props.visualizationRef) this.props.visualizationRef(this);
  };

  enableMenus = () => {
    // @ts-ignore
    this.menus.nodeMenu = this.cy.cxtmenu({
      menuRadius: 2 * styleVariables.nodeSize,
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
    this.menus.edgeMenu = this.cy.cxtmenu({
      menuRadius: 2 * styleVariables.nodeSize,
      selector: ".graph-edge",
      commands: [
        {
          content: "Remove",
          select: (edge: cytoscape.EdgeSingular) => {
            edge.parallelEdges().remove();
          }
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
            const capacity = parseInt(value as string, 10);
            if (!isNaN(capacity)) edge.data("capacity", capacity);
          }
        }
      ]
    });

    // @ts-ignore
    this.menus.coreMenu = this.cy.cxtmenu({
      menuRadius: 2 * styleVariables.nodeSize,
      selector: "core",
      commands: [
        {
          content: "Add Node",
          select: (target: cytoscape.Core, evt: cytoscape.EventObject) => {
            if (
              !this.cy ||
              target !== this.cy ||
              this.state.interactionDisabled
            )
              return; // only handle taps on background
            this.cy.add([
              {
                group: "nodes",
                data: { label: getNewNodeLabel(), type: "default" },
                classes: "graph-node",
                renderedPosition: {
                  x: evt.renderedPosition.x,
                  y: evt.renderedPosition.y
                }
              }
            ]);
          }
        }
      ]
    });
  };

  disableMenus = () => {
    Object.values(this.menus).forEach(menu => menu.destroy());
  };

  resetLayout = () => {
    if (!this.cy) return;
    if (this.layout) {
      this.layout.stop();
    }
    this.layout = this.cy.layout({
      name: "cola",
      // @ts-ignore
      edgeLength: 3 * styleVariables.nodeSize,
      randomize: false,
      infinite: true,
      fit: false,
      handleDisconnected: false
    });
    if (this.state.layoutRunning) {
      this.layout.run();
    }
  };

  componentDidUpdate = (
    prevProps: Partial<GraphVisualizationProps>,
    prevState: Partial<GraphVisualizationState>
  ) => {
    if (
      prevState.interactionDisabled !== this.state.interactionDisabled &&
      this.cy
    ) {
      if (this.state.interactionDisabled) {
        this.disableMenus();
        this.edgehandles.hide();
        this.edgehandles.disable();
      } else {
        this.enableMenus();
        this.edgehandles.enable();
      }
      this.restyle();
    }
    if (prevProps.graphDisplayState !== this.props.graphDisplayState) {
      this.restyle();
    }
    if (prevState.layoutRunning !== this.state.layoutRunning && this.layout) {
      if (this.state.layoutRunning) {
        this.layout.run();
      } else {
        this.layout.stop();
      }
    }
  };

  static getDerivedStateFromProps(
    props: GraphVisualizationProps,
    state: Partial<GraphVisualizationState>
  ): GraphVisualizationState {
    return {
      ...state,
      layoutRunning: props.autoLayout,
      interactionDisabled:
        props.disableInteraction || props.graphDisplayState === "original_flow"
    };
  }

  render = () => {
    return (
      <div className="graph-visualization">
        <div className="graph-visualization__overlay" />
        <div
          className="graph-visualization__cytoscape"
          ref={ref => {
            this.readyPromise.then(() => {
              if (!this.container) {
                this.container = ref;
                this.reset();
              }
            });
          }}
        />
      </div>
    );
  };
}

export default GraphVisualization;
