import React, { useEffect, useState } from "react";
import GraphVisualisation from "./GraphVisualisation";
import "./App.scss";
import FlowGraph from "./FlowGraph";
import Pseudocode from "./Pseudocode";

const graph = new FlowGraph(
  [
    { id: "A", type: "source", title: "A" },
    { id: "B", type: "default", title: "B" },
    { id: "C", type: "sink", title: "C" }
  ],
  [
    { source: "A", target: "B", capacity: 10, flow: 0 },
    { source: "B", target: "A", capacity: 0, flow: 0 },
    { source: "B", target: "C", capacity: 5, flow: 0 },
    { source: "C", target: "B", capacity: 0, flow: 0 }
  ]
);

interface Algorithm {
  name: string;
  pseudocode: string;
  implementation: (graph: FlowGraph) => void;
}

const App: React.FC = () => {
  const [algorithmName, setAlgorithmName] = useState("Edmonds-Karp");
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  useEffect(() => {
    import(`./algorithms/${algorithmName}.ts`).then(mod =>
      setAlgorithm(mod.default)
    );
  }, [algorithmName, setAlgorithm]);

  if (algorithm === null) return null;

  algorithm.implementation(graph);

  return (
    <div className="app">
      <GraphVisualisation graph={graph} />
      <Pseudocode algorithm={algorithm} />
    </div>
  );
};

export default App;
