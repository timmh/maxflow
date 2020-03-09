import cytoscape, { EdgeSingular } from "cytoscape";

/**
 * Parses a (subset of)
 * [Trivial Graph Format (TGF)](https://en.wikipedia.org/wiki/Trivial_Graph_Format)
 * and returns [cytoscape.js JSON](https://js.cytoscape.org/#notation/elements-json)
 *
 * @param tgf the graph in TGF format
 * @returns cytoscape element definitions
 */
const tgf2cyto: (tgf: String) => cytoscape.ElementDefinition[] = (
  tgf: String
) => {
  const lines = tgf
    .split("\n")
    .map(line => line.trim())
    .filter(line => !line.startsWith("#"));

  const tokens = lines.map(line =>
    line.split(/\W/).filter(token => token.length > 0)
  );
  const nodes = tokens
    .filter(tokens => tokens.length === 1 || tokens.length === 2)
    .map(tokens => {
      let type = "default";
      if (tokens[1] === "source") {
        type = "source";
      } else if (tokens[1] === "sink") {
        type = "sink";
      } else if (tokens[1] !== undefined) {
        throw new Error(`Invalid node type: ${tokens[1]}`);
      }
      return {
        data: {
          id: tokens[0],
          label: tokens[0],
          type
        },
        group: "nodes" as "nodes" | "edges" | undefined,
        classes: "graph-node"
      };
    });
  const edges = tokens
    .filter(tokens => tokens.length === 3)
    .map(tokens => ({
      data: {
        id: `${tokens[0]}-${tokens[1]}`,
        source: tokens[0],
        target: tokens[1],
        capacity: parseInt(tokens[2], 10) || 0,
        flow: 0
      },
      group: "edges" as "nodes" | "edges" | undefined,
      classes: "graph-edge"
    }));

  edges.forEach((edge: any) => {
    if (nodes.filter(node => node.data.id === edge.data.source).length !== 1) {
      throw new Error(
        `Invalid graph: there is no single node with id ${edge.data.source}`
      );
    }
    if (nodes.filter(node => node.data.id === edge.data.target).length !== 1) {
      throw new Error(
        `Invalid graph: there is no single node with id ${edge.data.target}`
      );
    }
    if (
      edges.filter(
        (otherEdge: any) =>
          edge.data.source === otherEdge.data.target &&
          edge.data.target === otherEdge.data.source
      ).length === 0
    ) {
      edges.push({
        data: {
          id: `${edge.data.target}-${edge.data.source}`,
          source: edge.data.target,
          target: edge.data.source,
          capacity: 0,
          flow: 0
        },
        group: "edges" as "nodes" | "edges" | undefined,
        classes: "graph-edge"
      });
    }
  });

  const elements = [...nodes, ...edges];

  return elements;
};

/**
 * Takes a [cytoscape.js](https://js.cytoscape.org/) instance
 * and returns the corresponding (subset of)
 * [Trivial Graph Format (TGF)](https://en.wikipedia.org/wiki/Trivial_Graph_Format)
 * representation
 *
 * @param cy the cytoscape.js instance
 * @returns TGF string representation
 */
const cyto2tgf = (cy: cytoscape.Core) => {
  const nodes = cy
    .nodes(".graph-node")
    .map(node =>
      [
        node.data("label"),
        node.data("type") !== "default" ? node.data("type") : null
      ]
        .filter(e => !!e)
        .join(" ")
    )
    .join("\n");
  const edges = cy
    .edges(".graph-edge")
    .filter(edge => edge.data("capacity") > 0)
    .map(edge =>
      [
        (edge as EdgeSingular).source().data("label"),
        (edge as EdgeSingular).target().data("label"),
        edge.data("capacity")
      ].join(" ")
    )
    .join("\n");

  return [nodes, edges].join("\n");
};

const urlSafeBase64Encode = (str: string) =>
  btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const urlSafeBase64Decode = (str: string) =>
  atob(
    (str + "===")
      .slice(0, str.length + (str.length % 4))
      .replace(/-/g, "+")
      .replace(/_/g, "/")
  );

export { tgf2cyto, cyto2tgf, urlSafeBase64Encode, urlSafeBase64Decode };
