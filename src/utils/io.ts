const tgf2cyto = (tgf: String) => {
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
        group: "nodes",
        classes: "graph-node"
      };
    });
  const edges = tokens
    .filter(tokens => tokens.length === 3)
    .map(tokens => ({
      data: {
        id: `${tokens[0]}-${tokens[0]}`,
        source: tokens[0],
        target: tokens[1],
        capacity: parseInt(tokens[2], 10) || 0,
        flow: 0
      },
      group: "edges",
      classes: "graph-edge"
    }));

  edges.forEach((edge: any) => {
    if (
      edges.filter(
        (otherEdge: any) =>
          edge.data.source === edge.data.target &&
          edge.data.target === edge.data.source
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
        group: "edges",
        classes: "graph-edge"
      });
    }
  });

  const elements = { nodes, edges };

  return elements;
};

export { tgf2cyto };
