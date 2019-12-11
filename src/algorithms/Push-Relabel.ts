import {
  Graph,
  GraphMutation,
  Node,
  Edge,
  GraphEdgeFlowMutation,
  GraphNodeHighlightMutation,
  GraphEdgeHighlightMutation,
  GraphNodeHeightMutation,
  GraphNodeExcessMutation,
  GraphCombinedMutation
} from "../CytoscapeGraph";

/** The Push-Relabel algorithm */

export default {
  name: "Push-Relabel",
  linearDataStructure: "none",
  pseudocode: String.raw`
    \begin{algorithm}
    \begin{algorithmic}
    \PROCEDURE{Push-Relabel}{$G=(V,\ E),\ s \in V,\ t \in V$}
        \FOR{vertex $v$}
          \STATE $v.h = 0$
          \STATE $v.e = 0$
        \ENDFOR

        \STATE $s.h = \left|V\right|$

        \FOR{vertex $v$ adjacent to $s$}
          \STATE $(s, v).f = (s, v).c$
          \STATE $v.e = (s, v).c$
          \STATE $s.e = s.e - (s, v).c$
        \ENDFOR

        \WHILE{there exists an applicable push or relabel operation}
            \STATE select an applicable push or relabel operation and perform it
        \ENDWHILE

        \RETURN $t.e$
    \ENDPROCEDURE
    \STATE
    \PROCEDURE{Push}{$u, v$}
        \STATE $\Delta f = \min(u.e, (u, v).c - (u, v).f)$
        \STATE $(u, v).f = (u, v).f + \Delta f$
        \STATE $(v, u).f = (v, u).f - \Delta f$
        \STATE $u.e = u.e - \Delta f$
        \STATE $v.e = v.e + \Delta f$
    \ENDPROCEDURE
    \STATE
    \PROCEDURE{Relabel}{$u$}
        \STATE $u.h = 1 + \min\{ v.h \colon (u, v).c > (u, v).f \}$
    \ENDPROCEDURE
    \end{algorithmic}
    \end{algorithm}
  `,
  labeledBlocks: [],
  implementation: function*(
    graph: Graph
  ): IterableIterator<{
    highlightedLines?: number[];
    linearNodes: Node[];
    graphMutations?: GraphMutation[];
    done?: true;
  }> {
    const sourceNode = graph.getSourceNode();

    yield {
      linearNodes: [],
      highlightedLines: [2, 3, 4, 5],
      graphMutations: graph
        .getNodes()
        .map(
          node =>
            new GraphCombinedMutation([
              new GraphNodeHeightMutation(node, 0),
              new GraphNodeExcessMutation(node, 0)
            ])
        )
    };

    yield {
      linearNodes: [],
      highlightedLines: [6],
      graphMutations: [
        new GraphNodeHeightMutation(sourceNode, graph.getNodes().length),
        new GraphNodeHighlightMutation(sourceNode)
      ]
    };

    yield {
      linearNodes: [],
      highlightedLines: [7, 8, 9, 10, 11],
      graphMutations: [
        ...sourceNode
          .getOutgoingEdges()
          .map(
            edge =>
              new GraphCombinedMutation([
                new GraphEdgeFlowMutation(edge, edge.getCapacity()),
                new GraphNodeExcessMutation(
                  edge.getTargetNode(),
                  edge.getCapacity()
                ),
                new GraphNodeExcessMutation(sourceNode, -edge.getCapacity()),
                new GraphEdgeHighlightMutation(edge)
              ])
          )
      ]
    };

    let mutationToUndo = new GraphCombinedMutation([
      new GraphNodeHighlightMutation(sourceNode),
      ...sourceNode
        .getOutgoingEdges()
        .map(edge => new GraphEdgeHighlightMutation(edge))
    ]);
    let finished = false;
    while (!finished) {
      let foundApplicableOperation = false;
      for (const edge of graph.getEdges()) {
        if (pushApplicable(edge)) {
          foundApplicableOperation = true;
          yield {
            linearNodes: [],
            graphMutations: [mutationToUndo.inverse(), push(edge)],
            highlightedLines: [13, 19, 20, 21, 22, 23]
          };
          mutationToUndo = push(edge);
          break;
        }
      }
      if (foundApplicableOperation) continue;
      for (const node of graph.getNodes()) {
        if (relabelApplicable(node)) {
          foundApplicableOperation = true;
          yield {
            linearNodes: [],
            graphMutations: [mutationToUndo.inverse(), relabel(node)],
            highlightedLines: [13, 27]
          };
          mutationToUndo = relabel(node);
          break;
        }
      }
      finished = !foundApplicableOperation;
    }

    yield {
      linearNodes: [],
      graphMutations: [mutationToUndo.inverse()],
      highlightedLines: [15],
      done: true
    };
  }
};

const min = (arr: number[]) =>
  arr.reduce((min, val) => (min < val ? min : val), arr[0]);

const pushApplicable = (e: Edge) => {
  const u = e.getSourceNode();
  const v = e.getTargetNode();
  return (
    u.getType() !== "sink" &&
    u.getExcess() > 0 &&
    e.getCapacity() > e.getFlow() &&
    u.getHeight() === v.getHeight() + 1
  );
};

const push = (e: Edge) => {
  const u = e.getSourceNode();
  const v = e.getTargetNode();
  const df = Math.min(u.getExcess(), e.getCapacity() - e.getFlow());

  return new GraphCombinedMutation([
    new GraphEdgeFlowMutation(e, df),
    new GraphEdgeHighlightMutation(e),
    new GraphEdgeFlowMutation(e.getReverseEdge(), -df),
    new GraphEdgeHighlightMutation(e.getReverseEdge()),
    new GraphNodeExcessMutation(u, -df),
    new GraphNodeHighlightMutation(u),
    new GraphNodeExcessMutation(v, df),
    new GraphNodeHighlightMutation(v)
  ]);
};

const relabelApplicable = (u: Node) =>
  u.getExcess() > 0 &&
  u
    .getOutgoingEdges()
    .filter(e => e.getCapacity() > e.getFlow())
    .every(e => u.getHeight() <= e.getTargetNode().getHeight());

const relabel = (u: Node) =>
  new GraphCombinedMutation([
    new GraphNodeHeightMutation(
      u,
      1 +
        min(
          u
            .getOutgoingEdges()
            .filter(e => e.getCapacity() > e.getFlow())
            .map(e => e.getTargetNode().getHeight())
        ) -
        u.getHeight()
    ),
    new GraphNodeHighlightMutation(u)
  ]);
