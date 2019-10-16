export type NodeId = string;

export interface Node {
  readonly id: NodeId;
  readonly type: "default" | "source" | "sink";
  title?: string;
}

export interface FlowLink {
  readonly source: { id: NodeId };
  readonly target: { id: NodeId };
  capacity: number;
  flow: number;
}

class FlowGraph {
  nodes: Node[];
  links: FlowLink[];

  constructor(nodes: Node[] = [], links: FlowLink[]) {
    FlowGraph.assertValidNodes(nodes);
    this.nodes = nodes;
    FlowGraph.assertValidLinks(nodes, links);
    this.links = links;
  }

  exportGraph = () => {
    return btoa(JSON.stringify({ nodes: this.nodes, links: this.links }));
  };

  importGraph = (exportedGraph: string) => {
    const { nodes, links } = JSON.parse(atob(exportedGraph));
    FlowGraph.assertValidNodes(nodes);
    FlowGraph.assertValidLinks(nodes, links);
    this.nodes = nodes;
    this.links = links;
  };

  static assertValidNodes(nodes: Node[]) {
    const nodeIds = nodes.map(node => node.id);
    if (nodeIds.length !== new Set(nodeIds).size) {
      throw new Error("Node ids are not unique");
    }
  }

  static assertValidLinks(nodes: Node[], links: FlowLink[]) {
    const nodeIds = nodes.map(node => node.id);
    if (
      links.filter(
        link =>
          nodeIds.includes(link.source.id) && nodeIds.includes(link.target.id)
      ).length !== links.length
    ) {
      throw new Error("Links contain unknown node ids");
    }

    const linkIds = links.map(link => `${link.source.id}-${link.target.id}`);
    if (linkIds.length !== new Set(linkIds).size) {
      throw new Error("Links are not unique");
    }
  }

  addNode = (node: Node) => {
    this.nodes = this.nodes.concat(node);
  };

  getNode = (nodeId: NodeId) => {
    return this.nodes.find(node => node.id === nodeId);
  };

  getSourceNode = () => {
    return this.nodes.find(node => node.type === "source")!;
  };

  getSinkNode = () => {
    return this.nodes.find(node => node.type === "sink")!;
  };

  removeNode = (nodeId: NodeId) => {
    if (!this.getNode(nodeId)) {
      throw new Error("Node does not exist");
    }
    this.nodes = this.nodes.filter(node => node.id !== nodeId);
    this.links = this.links.filter(
      link => link.source.id !== nodeId && link.target.id !== nodeId
    );
  };

  addLink = (link: FlowLink) => {
    FlowGraph.assertValidLinks(this.nodes, this.links.concat(link));
    this.links = this.links.concat(link);
  };

  getLink = (fromId: NodeId, toId: NodeId) => {
    return this.links.find(
      link => link.source.id === fromId && link.target.id === toId
    );
  };

  removeLink = (fromId: NodeId, toId: NodeId) => {
    if (!this.getLink(fromId, toId)) {
      throw new Error("Link does not exist");
    }
    this.links = this.links.filter(
      link => link.source.id !== fromId && link.target.id !== toId
    );
  };

  getLinksFromNode = (nodeId: NodeId) => {
    console.log(this.links);
    return this.links.filter(link => link.source.id === nodeId);
  };

  getLinksToNode = (nodeId: NodeId) => {
    return this.links.filter(link => link.target.id === nodeId);
  };
}

export default FlowGraph;
