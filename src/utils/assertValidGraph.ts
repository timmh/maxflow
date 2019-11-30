import cytoscape from "cytoscape";

/**
 * validates the graph for flow problems
 *
 * @param cy the cytoscape.js instance
 */
const assertValidGraph = (cy: cytoscape.Core) => {
  if (
    cy.nodes('node[type="source"]').length !== 1 ||
    cy.nodes('node[type="sink"]').length !== 1
  ) {
    throw new Error(
      "Graph must have exactly one source node and one sink node"
    );
  }
};

export default assertValidGraph;
