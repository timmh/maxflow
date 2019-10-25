import React, { useEffect, useState } from "react";
import GraphVisualisation, { Visualisation } from "./GraphVisualisation";
import "./App.scss";
import FlowGraph from "./FlowGraph";
import Pseudocode from "./Pseudocode";
import useInterval from "./utils/useInterval";

// const graph = new FlowGraph(
//   [
//     { id: "A", type: "source", title: "A" },
//     { id: "B", type: "default", title: "B" },
//     { id: "C", type: "sink", title: "C" }
//   ],
//   [
//     { source: { id: "A" }, target: { id: "B" }, capacity: 10, flow: 0 },
//     { source: { id: "B" }, target: { id: "A" }, capacity: 2, flow: 0 },
//     { source: { id: "B" }, target: { id: "C" }, capacity: 5, flow: 0 },
//     { source: { id: "C" }, target: { id: "B" }, capacity: 2, flow: 0 }
//   ]
// );

const graph = new FlowGraph(
  [
    { id: "A", type: "source", title: "A" },
    { id: "B", type: "default", title: "B" },
    { id: "C", type: "default", title: "C" },
    { id: "D", type: "default", title: "D" },
    { id: "E", type: "default", title: "E" },
    { id: "F", type: "default", title: "F" },
    { id: "G", type: "sink", title: "G" }
  ],
  [
    { source: { id: "A" }, target: { id: "B" }, capacity: 3, flow: 0 },
    { source: { id: "A" }, target: { id: "D" }, capacity: 3, flow: 0 },
    { source: { id: "B" }, target: { id: "C" }, capacity: 4, flow: 0 },
    { source: { id: "C" }, target: { id: "A" }, capacity: 3, flow: 0 },
    { source: { id: "C" }, target: { id: "D" }, capacity: 1, flow: 0 },
    { source: { id: "C" }, target: { id: "E" }, capacity: 2, flow: 0 },
    { source: { id: "D" }, target: { id: "E" }, capacity: 2, flow: 0 },
    { source: { id: "D" }, target: { id: "F" }, capacity: 6, flow: 0 },
    { source: { id: "E" }, target: { id: "B" }, capacity: 1, flow: 0 },
    { source: { id: "E" }, target: { id: "G" }, capacity: 1, flow: 0 },
    { source: { id: "F" }, target: { id: "G" }, capacity: 9, flow: 0 }
  ]
);

graph.importGraph(
  "eyJub2RlcyI6W3siaWQiOiJBIiwidHlwZSI6InNvdXJjZSIsInRpdGxlIjoiQSIsImluZGV4IjowLCJ4Ijo0MTYuMzMwNTIwNzUyNTA0NSwieSI6MzEwLjA0MzM0NzgzNTM3ODQsInZ5IjotNWUtMzI0LCJ2eCI6LTVlLTMyNCwiZngiOm51bGwsImZ5IjpudWxsfSx7ImlkIjoiQiIsInR5cGUiOiJkZWZhdWx0IiwidGl0bGUiOiJCIiwiaW5kZXgiOjEsIngiOjQxNC4yMDUwODIwMzMwODQyLCJ5Ijo1MDAuMjk4NDg4OTE5Mjc3OSwidnkiOjAsInZ4IjowLCJmeCI6bnVsbCwiZnkiOm51bGx9LHsiaWQiOiJDIiwidHlwZSI6ImRlZmF1bHQiLCJ0aXRsZSI6IkMiLCJpbmRleCI6MiwieCI6NTQ1LjIwNjkxOTYzNTU1NTksInkiOjQxMy41OTYwNDU0Mjk1NTI4LCJ2eSI6MCwidngiOjAsImZ4IjpudWxsLCJmeSI6bnVsbH0seyJpZCI6IkQiLCJ0eXBlIjoiZGVmYXVsdCIsInRpdGxlIjoiRCIsImluZGV4IjozLCJ4Ijo2ODIuNDYxNjI2Mzg4MDY1NiwieSI6MzIyLjc0MzY2MzYwMjYxMTY2LCJ2eSI6MCwidngiOjAsImZ4IjpudWxsLCJmeSI6bnVsbH0seyJpZCI6IkUiLCJ0eXBlIjoiZGVmYXVsdCIsInRpdGxlIjoiRSIsImluZGV4Ijo0LCJ4Ijo2ODkuMTkxMTM5MDczODc3MywieSI6NDk4LjY1NDg5NjU4ODQzODY1LCJ2eSI6MCwidngiOjAsImZ4IjpudWxsLCJmeSI6bnVsbH0seyJpZCI6IkYiLCJ0eXBlIjoiZGVmYXVsdCIsInRpdGxlIjoiRiIsImluZGV4Ijo1LCJ4Ijo4NjYuMzQxODg0Njk0ODgyMiwieSI6MzIxLjU3NDY4MjMwNzE2NTcsInZ5IjowLCJ2eCI6MCwiZngiOm51bGwsImZ5IjpudWxsfSx7ImlkIjoiRyIsInR5cGUiOiJzaW5rIiwidGl0bGUiOiJHIiwiaW5kZXgiOjYsIngiOjg2Ni4yNjI4Mjc0MjIwMzAyLCJ5Ijo0OTkuNTg4ODc1MzE3NTc0OSwidnkiOjAsInZ4IjowLCJmeCI6bnVsbCwiZnkiOm51bGx9XSwibGlua3MiOlt7InNvdXJjZSI6eyJpZCI6IkEiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJCIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjMsImZsb3ciOjAsImluZGV4IjowfSx7InNvdXJjZSI6eyJpZCI6IkEiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJEIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjMsImZsb3ciOjAsImluZGV4IjoxfSx7InNvdXJjZSI6eyJpZCI6IkIiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJDIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjQsImZsb3ciOjAsImluZGV4IjoyfSx7InNvdXJjZSI6eyJpZCI6IkMiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJBIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjMsImZsb3ciOjAsImluZGV4IjozfSx7InNvdXJjZSI6eyJpZCI6IkMiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJEIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjEsImZsb3ciOjAsImluZGV4Ijo0fSx7InNvdXJjZSI6eyJpZCI6IkMiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJFIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjIsImZsb3ciOjAsImluZGV4Ijo1fSx7InNvdXJjZSI6eyJpZCI6IkQiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJFIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjIsImZsb3ciOjAsImluZGV4Ijo2fSx7InNvdXJjZSI6eyJpZCI6IkQiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJGIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjYsImZsb3ciOjAsImluZGV4Ijo3fSx7InNvdXJjZSI6eyJpZCI6IkUiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJCIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjEsImZsb3ciOjAsImluZGV4Ijo4fSx7InNvdXJjZSI6eyJpZCI6IkUiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJHIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjEsImZsb3ciOjAsImluZGV4Ijo5fSx7InNvdXJjZSI6eyJpZCI6IkYiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJHIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjksImZsb3ciOjAsImluZGV4IjoxMH0seyJzb3VyY2UiOnsiaWQiOiJCIiwidngiOm51bGwsInZ5IjpudWxsfSwidGFyZ2V0Ijp7ImlkIjoiQSIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sImNhcGFjaXR5IjowLCJmbG93IjowLCJpbmRleCI6MTF9LHsic291cmNlIjp7ImlkIjoiRCIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sInRhcmdldCI6eyJpZCI6IkEiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJjYXBhY2l0eSI6MCwiZmxvdyI6MCwiaW5kZXgiOjEyfSx7InNvdXJjZSI6eyJpZCI6IkMiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJCIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjAsImZsb3ciOjAsImluZGV4IjoxM30seyJzb3VyY2UiOnsiaWQiOiJBIiwidngiOm51bGwsInZ5IjpudWxsfSwidGFyZ2V0Ijp7ImlkIjoiQyIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sImNhcGFjaXR5IjowLCJmbG93IjowLCJpbmRleCI6MTR9LHsic291cmNlIjp7ImlkIjoiRCIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sInRhcmdldCI6eyJpZCI6IkMiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJjYXBhY2l0eSI6MCwiZmxvdyI6MCwiaW5kZXgiOjE1fSx7InNvdXJjZSI6eyJpZCI6IkUiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJDIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjAsImZsb3ciOjAsImluZGV4IjoxNn0seyJzb3VyY2UiOnsiaWQiOiJFIiwidngiOm51bGwsInZ5IjpudWxsfSwidGFyZ2V0Ijp7ImlkIjoiRCIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sImNhcGFjaXR5IjowLCJmbG93IjowLCJpbmRleCI6MTd9LHsic291cmNlIjp7ImlkIjoiRiIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sInRhcmdldCI6eyJpZCI6IkQiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJjYXBhY2l0eSI6MCwiZmxvdyI6MCwiaW5kZXgiOjE4fSx7InNvdXJjZSI6eyJpZCI6IkIiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJ0YXJnZXQiOnsiaWQiOiJFIiwidngiOm51bGwsInZ5IjpudWxsfSwiY2FwYWNpdHkiOjAsImZsb3ciOjAsImluZGV4IjoxOX0seyJzb3VyY2UiOnsiaWQiOiJHIiwidngiOm51bGwsInZ5IjpudWxsfSwidGFyZ2V0Ijp7ImlkIjoiRSIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sImNhcGFjaXR5IjowLCJmbG93IjowLCJpbmRleCI6MjB9LHsic291cmNlIjp7ImlkIjoiRyIsInZ4IjpudWxsLCJ2eSI6bnVsbH0sInRhcmdldCI6eyJpZCI6IkYiLCJ2eCI6bnVsbCwidnkiOm51bGx9LCJjYXBhY2l0eSI6MCwiZmxvdyI6MCwiaW5kZXgiOjIxfV19"
);

// @ts-ignore
window.exportGraph = () => graph.exportGraph();
// @ts-ignore
window.importGraph = t => graph.importGraph(t);

interface Algorithm {
  name: string;
  pseudocode: string;
  implementation: (graph: FlowGraph) => Generator<never, void, unknown>;
}

const App: React.FC = () => {
  const [algorithmName] = useState("Edmonds-Karp");
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  useEffect(() => {
    import(`./algorithms/${algorithmName}.ts`).then(mod =>
      setAlgorithm(mod.default)
    );
  }, [algorithmName, setAlgorithm]);
  const [
    algorithmImplementationInstance,
    setAlgorithmImplementationInstance
  ] = useState<Generator<{
    visualisations: Visualisation[];
    highlightedLines: number[];
  }> | null>(null);
  useEffect(() => {
    algorithm &&
      setAlgorithmImplementationInstance(algorithm.implementation(graph));
  }, [algorithm]);
  const [visualisations, setVisualisations] = useState<Visualisation[]>([]);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  useInterval(
    () => {
      if (!algorithmImplementationInstance) return;
      const result = algorithmImplementationInstance.next();
      if (!result || result.done) {
        // setVisualisations([]);
        // setHighlightedLines([]);
      } else {
        const { visualisations, highlightedLines } = result.value;
        setVisualisations(visualisations);
        setHighlightedLines(highlightedLines);
      }
    },
    1000,
    [algorithmImplementationInstance]
  );

  if (algorithm === null) return null;

  return (
    <div className="app">
      <GraphVisualisation graph={graph} visualisations={visualisations} />
      <Pseudocode algorithm={algorithm} highlightedLines={highlightedLines} />
    </div>
  );
};

export default App;
