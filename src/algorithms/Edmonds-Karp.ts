import FlowGraph, { FlowLink } from "../FlowGraph";
import { Visualisation, VisRef } from "../GraphVisualisation";
import { EdgeSingular } from "cytoscape";

const resetHighlighted = (cy: any) => {};

export default {
  name: "Edmonds-Karp",
  pseudocode: String.raw`
    \begin{algorithm}
    \begin{algorithmic}
    \PROCEDURE{Edmonds-Karp}{$N=(V,\ E),\ s \in V,\ t \in V$}
        \STATE $f = 0$
        \REPEAT
            \STATE $p = \left[\ \right]$
            \STATE $q = \left[\ \right]$
            \WHILE{$q_\mathrm{length}$ = 0}
                \STATE $c =$ \CALL{dequeue}{$q$}
                \FOR{edge $e$ originating from $c$}
                    \IF{$e_\mathrm{target} \notin p$ \AND $e_\mathrm{target} \neq s$ \AND $e_\mathrm{capacity} > e_\mathrm{flow}$}
                        \STATE $p[e_\mathrm{target}] = e$
                        \STATE \CALL{enqueue}{$q$, $e_\mathrm{target}$}
                    \ENDIF
                \ENDFOR
            \ENDWHILE
            \IF{$p[t] \neq \varnothing$}
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
        \UNTIL{$p[t] = \varnothing$}
        \RETURN $f$
    \ENDPROCEDURE
    \end{algorithmic}
    \end{algorithm}
  `,
  implementation: function*(
    vis: VisRef
  ): IterableIterator<{
    highlightedLines: number[];
  }> {
    const sourceNode = vis.cy.nodes('node[type="source"]')[0];
    const sinkNode = vis.cy.nodes('node[type="sink"]')[0];
    // const sourceNode = graph.getSourceNode();
    // const sinkNode = graph.getSinkNode();

    let flow = 0;
    let pred: { [key: string]: cytoscape.EdgeSingular };
    // let flow = 0; // initialize flow to zero
    // let pred: { [key: string]: FlowLink };
    // let finalPred: { [key: string]: FlowLink } = {};

    do {
      const q = [sourceNode];
      pred = {};

      while (q.length > 0) {
        const cur: cytoscape.NodeSingular = q.shift()!;
        vis.cy.$(".highlighted").removeClass("highlighted");
        cur.addClass("highlighted");
        yield {
          highlightedLines: [7]
        };
        for (let link of cur!.outgoers("edge").toArray() as EdgeSingular[]) {
          if (
            pred[link.target().id()] === undefined &&
            link.target().id() !== sourceNode.id() &&
            link.data("capacity") > link.data("flow")
          ) {
            vis.cy.$(".highlighted").removeClass("highlighted");
            link.target().addClass("highlighted");
            yield {
              highlightedLines: [10, 11]
            };
            pred[link.target().id()] = link;
            q.push(link.target());
          }
        }
      }
      if (pred[sinkNode.id()] !== undefined) {
        // found an augmenting path
        let df = Infinity;
        let currentLink = pred[sinkNode.id()];
        while (currentLink !== undefined) {
          df = Math.min(
            df,
            currentLink.data("capacity") - currentLink.data("flow")
          );
          currentLink = pred[currentLink.source().id()];
        }

        currentLink = pred[sinkNode.id()];
        while (currentLink !== undefined) {
          const reverseCurrentLink = currentLink
            .parallelEdges()
            .difference(currentLink.codirectedEdges())[0];
          currentLink.data("flow", currentLink.data("flow") + df);
          vis.cy.$(".highlighted").removeClass("highlighted");
          currentLink.addClass("highlighted");
          yield {
            highlightedLines: [22]
          };
          reverseCurrentLink.data("flow", reverseCurrentLink.data("flow") - df);
          vis.cy.$(".highlighted").removeClass("highlighted");
          reverseCurrentLink.addClass("highlighted");
          yield {
            highlightedLines: [23]
          };
          currentLink = pred[currentLink.source().id()];
        }
        flow = flow + df;
      }
    } while (pred[sinkNode.id()] !== undefined);
    vis.cy.$(".highlighted").removeClass("highlighted");
    yield {
      highlightedLines: [28]
    };
    return flow;
  },
  cleanup: (vis: VisRef) => {
    vis.cy.$(".graph-edge").data("flow", 0);
    vis.cy.$(".highlighted").removeClass("highlighted");
  }
};
