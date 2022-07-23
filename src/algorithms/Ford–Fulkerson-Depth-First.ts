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

/** The Ford-Fulkerson algorithm using depth-first search */
const FordFulkerson: Algorithm = {
  name: "Ford–Fulkerson-Depth-First",
  linearDataStructure: "stack",
  pseudocode: ({ sourceName, sinkName }) => String.raw`
    \begin{algorithm}
    \begin{algorithmic}
    \PROCEDURE{Ford-Fulkerson}{$G=(V,\ E),\ ${sourceName} \in V,\ ${sinkName} \in V$}
        \STATE $f = 0$
        \REPEAT
            \STATE $p = \left[\ \right]$
            \STATE $u = \left[\ ${sourceName}\ \right]$ \COMMENT{create stack}
            \WHILE{$u_\mathrm{height}$ > 0}
                \STATE $c =$ \CALL{pop}{$u$}
                \FOR{edge $e$ originating from $c$}
                    \IF{$e_\mathrm{target} \notin p$ \AND $e_\mathrm{target} \neq ${sourceName}$ \AND $e_\mathrm{capacity} > e_\mathrm{flow}$}
                        \STATE $p[e_\mathrm{target}] = e$
                        \STATE \CALL{push}{$u$, $e_\mathrm{target}$}
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
    { label: `Ford-Fulkerson Algorithm at Brilliant.org`, url: 'https://brilliant.org/wiki/ford-fulkerson-algorithm/' },
    { label: `L. R. Ford, D. R. Fulkerson: Maximal Flow Through a Network (1956)`, url: 'https://www.cambridge.org/core/services/aop-cambridge-core/content/view/5D6E55D3B06C4F7B1043BC1D82D40764/S0008414X00036890a.pdf/maximal_flow_through_a_network.pdf'}
  ],
  labeledBlocks: [
    { lines: [4, 14], label: "Depth-first search" },
    { lines: [15, 26], label: "Increase flow along found path" },
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
      const u = [sourceNode];
      pred = {};

      const mutationsToUndoAfterSearch = [];

      yield {
        highlightedLines: [4, 5],
        linearNodes: u
      };

      while (u.length > 0 && !pred[sinkNode.getId()]) {
        const highlightedEdge = pred[u[u.length - 1].getId()];
        if (highlightedEdge) {
          mutationsToUndoAfterSearch.push(
            new GraphEdgeHighlightMutation(highlightedEdge).inverse()
          );
          yield {
            highlightedLines: [10, 11],
            linearNodes: u,
            graphMutations: [new GraphEdgeHighlightMutation(highlightedEdge)]
          };
        }

        const cur = u.pop()!;
        mutationsToUndoAfterSearch.push(
          new GraphNodeHighlightMutation(cur).inverse()
        );
        yield {
          highlightedLines: [7],
          linearNodes: u,
          graphMutations: [new GraphNodeHighlightMutation(cur)]
        };
        for (let edge of cur.getOutgoingEdges()) {
          if (
            pred[edge.getTargetNode().getId()] === undefined &&
            !edge.getTargetNode().isEqualTo(sourceNode) &&
            edge.getCapacity() > edge.getFlow()
          ) {
            pred[edge.getTargetNode().getId()] = edge;
            u.push(edge.getTargetNode());
          }
          yield {
            highlightedLines: [10, 11],
            linearNodes: u
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
          linearNodes: u,
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
            linearNodes: u,
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
          linearNodes: u,
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

export default FordFulkerson;
