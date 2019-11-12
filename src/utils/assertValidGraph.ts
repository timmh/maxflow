import cytoscape from "cytoscape";

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
