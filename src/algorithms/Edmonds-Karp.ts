import FlowGraph, { FlowLink } from "../FlowGraph";
import { Visualisation } from "../GraphVisualisation";

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
    graph: FlowGraph
  ): IterableIterator<Visualisation[]> {
    const sourceNode = graph.getSourceNode();
    const sinkNode = graph.getSinkNode();

    let flow = 0; // initialize flow to zero
    let pred: { [key: string]: FlowLink };
    do {
      const q = [sourceNode]; // queue initially only contains the source node
      pred = {}; // pred stores the link taken to each vertex
      while (q.length > 0) {
        const cur = q.shift()!;
        console.log(graph.getLinksFromNode(cur.id));
        yield [{ type: "HIGHLIGHT_NODE", node: cur }];
        for (const link of graph.getLinksFromNode(cur.id)) {
          if (
            pred[link.target] === undefined &&
            link.target !== sourceNode.id &&
            link.capacity > link.flow
          ) {
            yield [
              { type: "HIGHLIGHT_NODE", node: graph.getNode(link.target)! },
              { type: "HIGHLIGHT_LINK", link: link }
            ];
            pred[link.target] = link;
            q.push(graph.getNode(link.target)!);
          }
        }
      }
      if (pred[sinkNode.id] !== undefined) {
        // found an augmenting path
        let df = Infinity;
        let currentLink = pred[sinkNode.id];
        while (currentLink !== undefined) {
          df = Math.min(df, currentLink.capacity - currentLink.flow);
          currentLink = pred[currentLink.source];
        }

        currentLink = pred[sinkNode.id];
        while (currentLink !== undefined) {
          const reverseCurrentLink = graph.getLink(
            currentLink.target,
            currentLink.source
          )!;
          currentLink.flow = currentLink.flow + df;
          reverseCurrentLink.flow = reverseCurrentLink.flow - df;
          currentLink = pred[currentLink.source];
        }
        flow = flow + df;
      }
    } while (pred[sinkNode.id] !== undefined);
  }
};
