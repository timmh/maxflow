import {
  Graph,
  GraphMutation,
  Node,
  Edge,
  GraphEdgeFlowMutation,
  GraphNodeHighlightMutation,
  GraphEdgeHighlightMutation
} from "../CytoscapeGraph";
import { Algorithm } from "../algorithm";

/** The Edmonds-Karp algorithm */
const EdmondsKarp: Algorithm = {
  name: "Edmonds-Karp",
  linearDataStructure: "queue",
  pseudocode: ({ sourceName, sinkName }) => String.raw`
    \begin{algorithm}
    \begin{algorithmic}
    \PROCEDURE{Edmonds-Karp}{$G=(V,\ E),\ ${sourceName} \in V,\ ${sinkName} \in V$}
        \STATE $f = 0$
        \REPEAT
            \STATE $p = \left[\ \right]$
            \STATE $q = \left[\ ${sourceName}\ \right]$ \COMMENT{create queue}
            \WHILE{$q_\mathrm{length}$ > 0}
                \STATE $c =$ \CALL{dequeue}{$q$}
                \FOR{edge $e$ originating from $c$}
                    \IF{$e_\mathrm{target} \notin p$ \AND $e_\mathrm{target} \neq ${sourceName}$ \AND $e_\mathrm{capacity} > e_\mathrm{flow}$}
                        \STATE $p[e_\mathrm{target}] = e$
                        \STATE \CALL{enqueue}{$q$, $e_\mathrm{target}$}
                    \ENDIF
                \ENDFOR
            \ENDWHILE
            \IF{$p[${sinkName}] \neq \varnothing$}
                \STATE $\Delta f = \infty$
                \FOR{$e \in p$}
                    \STATE $\Delta f = $ \CALL{min}{$\Delta f$, $e_\mathrm{capacity} - e_\mathrm{flow}$}
                \ENDFOR
                \FOR{$e \in p$}
                    \STATE $r = e_\mathrm{reverse}$
                    \STATE $e_\mathrm{flow} = e_\mathrm{flow} + \Delta f$
                    \STATE $r_\mathrm{flow} = r_\mathrm{flow} - \Delta f$
                \ENDFOR
                \STATE $f = f + \Delta f$
            \ENDIF
        \UNTIL{$p[${sinkName}] = \varnothing$}
        \RETURN $f$
    \ENDPROCEDURE
    \end{algorithmic}
    \end{algorithm}
  `,
  references: [
    {
      label: `Edmonds-Karp Algorithm at Brilliant.org`,
      url: "https://brilliant.org/wiki/edmonds-karp-algorithm/"
    },
    {
      label: `Jack Edmonds, Richard M. Karp: Theoretical improvements in algorithmic efficiency for network flow problems (1972)`,
      url:
        "https://web.eecs.umich.edu/~pettie/matching/Edmonds-Karp-network-flow.pdf"
    }
  ],
  labeledBlocks: [
    { lines: [4, 14], color: "#ffdcdc", label: "Breadth-first search" },
    {
      lines: [15, 26],
      color: "#e3ffff",
      label: "Increase flow along found path"
    }
  ],
  implementation: function*(
    graph: Graph
  ): IterableIterator<{
    highlightedLines?: number[];
    linearNodes: Node[];
    graphMutations?: GraphMutation[];
    done?: true;
  }> {
    const sourceNode = graph.getSourceNode();
    const sinkNode = graph.getSinkNode();

    let flow = 0;
    let pred: { [key: string]: Edge };

    do {
      const q = [sourceNode];
      pred = {};

      const mutationsToUndoAfterSearch = [];

      yield {
        highlightedLines: [4, 5],
        linearNodes: q
      };

      while (q.length > 0 && !pred[sinkNode.getId()]) {
        const cur = q.shift()!;
        mutationsToUndoAfterSearch.push(
          new GraphNodeHighlightMutation(cur).inverse()
        );
        yield {
          highlightedLines: [7],
          linearNodes: q,
          graphMutations: [new GraphNodeHighlightMutation(cur)]
        };
        for (let edge of cur.getOutgoingEdges()) {
          if (
            pred[edge.getTargetNode().getId()] === undefined &&
            !edge.getTargetNode().isEqualTo(sourceNode) &&
            edge.getCapacity() > edge.getFlow()
          ) {
            pred[edge.getTargetNode().getId()] = edge;
            q.push(edge.getTargetNode());
          }
          mutationsToUndoAfterSearch.push(
            new GraphEdgeHighlightMutation(edge).inverse()
          );
          yield {
            highlightedLines: [10, 11],
            linearNodes: q,
            graphMutations: [new GraphEdgeHighlightMutation(edge)]
          };
          if (edge.getTargetNode().isEqualTo(sinkNode)) break;
        }
      }
      if (pred[sinkNode.getId()] !== undefined) {
        let currentHighlightEdge = pred[sinkNode.getId()];
        const foundPathHighlightMutations: GraphMutation[] = [];
        while (currentHighlightEdge) {
          foundPathHighlightMutations.push(
            new GraphEdgeHighlightMutation(currentHighlightEdge),
            new GraphNodeHighlightMutation(
              currentHighlightEdge.getSourceNode()
            ),
            new GraphNodeHighlightMutation(currentHighlightEdge.getTargetNode())
          );
          currentHighlightEdge =
            pred[currentHighlightEdge.getSourceNode().getId()];
        }
        const mutationsToUndoAfterUpdate = foundPathHighlightMutations
          .slice()
          .reverse()
          .map(mutation => mutation.inverse());

        yield {
          highlightedLines: [16],
          linearNodes: q,
          graphMutations: [
            ...mutationsToUndoAfterSearch,
            ...foundPathHighlightMutations
          ]
        };

        let df = Infinity;
        let currentEdge = pred[sinkNode.getId()];
        while (currentEdge !== undefined) {
          df = Math.min(df, currentEdge.getCapacity() - currentEdge.getFlow());
          currentEdge = pred[currentEdge.getSourceNode().getId()];
        }

        currentEdge = pred[sinkNode.getId()];
        while (currentEdge !== undefined) {
          const reverseCurrentEdge = currentEdge.getReverseEdge();
          yield {
            highlightedLines: [22, 23],
            linearNodes: q,
            graphMutations: [
              new GraphEdgeFlowMutation(currentEdge, df),
              new GraphEdgeFlowMutation(reverseCurrentEdge, -df)
            ]
          };
          currentEdge = pred[currentEdge.getSourceNode().getId()];
        }
        flow = flow + df;
        yield {
          highlightedLines: [25],
          linearNodes: q,
          graphMutations: mutationsToUndoAfterUpdate
        };
      }
    } while (pred[sinkNode.getId()] !== undefined);
    yield {
      highlightedLines: [28],
      linearNodes: [],
      done: true
    };
    return flow;
  }
};

export default EdmondsKarp;
