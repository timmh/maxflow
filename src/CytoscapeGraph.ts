import cytoscape from "cytoscape";

/**
 * The interface each graph mutation (both visual and non-visual)
 * has to conform to
 */
export interface GraphMutation {
  /** applies the mutation on the cytoscape.js instance */
  apply: () => void;

  /** returns the inverse mutation, primarily used for backstepping */
  inverse: () => GraphMutation;
}

/**
 * Mutates the flow along an edge
 */
export class GraphEdgeFlowMutation implements GraphMutation {
  _edge: Edge;
  _df: number;

  constructor(edge: Edge, df: number) {
    this._edge = edge;
    this._df = df;
  }

  apply = () => {
    this._edge._cyEdge.data("flow", this._edge._cyEdge.data("flow") + this._df);
  };

  inverse = () => new GraphEdgeFlowMutation(this._edge, -this._df);
}

/**
 * (Un)highlights an edge
 */
export class GraphEdgeHighlightMutation implements GraphMutation {
  _edge: Edge;
  _mode: "add" | "remove";

  constructor(edge: Edge, mode: "add" | "remove" = "add") {
    this._edge = edge;
    this._mode = mode;
  }

  apply = () => {
    if (this._mode === "add") {
      this._edge._cyEdge.addClass("highlighted").emit("restyle");
    } else {
      this._edge._cyEdge.removeClass("highlighted").emit("restyle");
    }
  };

  inverse = () =>
    new GraphEdgeHighlightMutation(
      this._edge,
      this._mode === "add" ? "remove" : "add"
    );
}

/**
 * (Un)highlights a node
 */
export class GraphNodeHighlightMutation implements GraphMutation {
  _node: Node;
  _mode: "add" | "remove";

  constructor(node: Node, mode: "add" | "remove" = "add") {
    this._node = node;
    this._mode = mode;
  }

  apply = () => {
    if (this._mode === "add") {
      this._node._cyNode.addClass("highlighted").emit("restyle");
    } else {
      this._node._cyNode.removeClass("highlighted").emit("restyle");
    }
  };

  inverse = () =>
    new GraphNodeHighlightMutation(
      this._node,
      this._mode === "add" ? "remove" : "add"
    );
}

/**
 * The Edge class wraps cytoscape.js edges to allow the algorithms to be less
 * dependent on the actual graph implementation
 */
export class Edge {
  _cyEdge: cytoscape.EdgeSingular;

  constructor(cyEdge: cytoscape.EdgeSingular) {
    this._cyEdge = cyEdge;
  }

  getCapacity = () => this._cyEdge.data("capacity");
  getFlow = () => this._cyEdge.data("flow");
  getReverseEdge = () =>
    new Edge(
      this._cyEdge.parallelEdges().difference(this._cyEdge.codirectedEdges())[0]
    );
  getSourceNode = () => new Node(this._cyEdge.source());
  getTargetNode = () => new Node(this._cyEdge.target());
  getId = () => this._cyEdge.id();
  isEqualTo = (otherEdge: Edge) => this._cyEdge.id() === otherEdge._cyEdge.id();
}

/**
 * The Node class wraps cytoscape.js nodes to allow the algorithms to be less
 * dependent on the actual graph implementation
 */
export class Node {
  _cyNode: cytoscape.NodeSingular;

  constructor(cyNode: cytoscape.NodeSingular) {
    this._cyNode = cyNode;
  }

  getOutgoingEdges = () =>
    this._cyNode
      .outgoers("edge")
      .sort((edge1, edge2) => {
        const label1 = (edge1 as cytoscape.EdgeSingular).target().data("label");
        const label2 = (edge2 as cytoscape.EdgeSingular).target().data("label");
        if (label1 < label2) return -1;
        if (label1 > label2) return 1;
        return 0;
      })
      .toArray()
      .map(cyEdge => new Edge(cyEdge as cytoscape.EdgeSingular));

  getType = () => {
    if (this._cyNode.data("type") === "source") return "source";
    if (this._cyNode.data("type") === "sink") return "sink";
    return "default";
  };

  getLabel = () => {
    return `${this._cyNode.data("label")}`;
  };

  getId = () => this._cyNode.id();
  isEqualTo = (otherNode: Node) => this._cyNode.id() === otherNode._cyNode.id();
}

/**
 * The Graph class wraps the cytoscape.js graph to allow the algorithms to be less
 * dependent on the actual graph implementation
 */
export class Graph {
  _cy: cytoscape.Core;

  constructor(cy: cytoscape.Core) {
    this._cy = cy;
  }

  getSourceNode = () => new Node(this._cy.nodes('node[type="source"]')[0]);
  getSinkNode = () => new Node(this._cy.nodes('node[type="sink"]')[0]);
}
