import { VisRef } from "../GraphVisualisation";
import { EdgeSingular } from "cytoscape";

export default {
  name: "Edmonds-Karp",
  pseudocode: String.raw`
    \begin{algorithm}
    \begin{algorithmic}
    \PROCEDURE{Edmonds-Karp}{$N=(V,\ E),\ s \in V,\ t \in V$}
        \STATE $f = 0$
        \REPEAT
            \STATE $p = \left[\ \right]$
            \STATE $q = \left[\ s\ \right]$
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
    queueElements?: any[];
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
      vis.cy.$(".highlighted").removeClass("highlighted");
      const q = [sourceNode];
      pred = {};

      yield {
        highlightedLines: [4, 5],
        queueElements: q.map(e => ({
          label: e.data("label"),
          type: e.data("type")
        }))
      };

      while (q.length > 0) {
        const cur: cytoscape.NodeSingular = q.shift()!;
        // vis.cy.$(".highlighted").removeClass("highlighted");
        cur.addClass("highlighted");
        yield {
          highlightedLines: [7],
          queueElements: q.map(e => ({
            label: e.data("label"),
            type: e.data("type")
          }))
        };
        for (let link of cur!
          .outgoers("edge")
          .sort((edge1, edge2) => {
            const label1 = (edge1 as EdgeSingular).target().data("label");
            const label2 = (edge2 as EdgeSingular).target().data("label");
            if (label1 < label2) return -1;
            if (label1 > label2) return 1;
            return 0;
          })
          .toArray() as EdgeSingular[]) {
          if (
            pred[link.target().id()] === undefined &&
            link.target().id() !== sourceNode.id() &&
            link.data("capacity") > link.data("flow")
          ) {
            // vis.cy.$(".highlighted").removeClass("highlighted");
            link.addClass("highlighted");
            link.target().addClass("highlighted");
            yield {
              highlightedLines: [10, 11],
              queueElements: q.map(e => ({
                label: e.data("label"),
                type: e.data("type")
              }))
            };
            pred[link.target().id()] = link;
            q.push(link.target());
          }
        }
      }
      if (pred[sinkNode.id()] !== undefined) {
        // found an augmenting path

        vis.cy.$(".highlighted").removeClass("highlighted");

        let currentHighlightEdge = pred[sinkNode.id()];
        while (currentHighlightEdge) {
          currentHighlightEdge.addClass("highlighted");
          currentHighlightEdge.source().addClass("highlighted");
          currentHighlightEdge.target().addClass("highlighted");
          currentHighlightEdge = pred[currentHighlightEdge.source().id()];
        }

        yield {
          highlightedLines: [16],
          queueElements: q.map(e => ({
            label: e.data("label"),
            type: e.data("type")
          }))
        };

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
          reverseCurrentLink.data("flow", reverseCurrentLink.data("flow") - df);
          vis.cy.$(".highlighted").removeClass("highlighted");
          currentLink.addClass("highlighted");
          reverseCurrentLink.addClass("highlighted");
          yield {
            highlightedLines: [22, 23],
            queueElements: q.map(e => ({
              label: e.data("label"),
              type: e.data("type")
            }))
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
