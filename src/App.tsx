import React, { useEffect, useState } from "react";
import GraphVisualisation, { Visualisation } from "./GraphVisualisation";
import "./App.scss";
import FlowGraph from "./FlowGraph";
import Pseudocode from "./Pseudocode";
import useInterval from "./utils/useInterval";

const graph = new FlowGraph(
  [
    { id: "A", type: "source", title: "A" },
    { id: "B", type: "default", title: "B" },
    { id: "C", type: "sink", title: "C" }
  ],
  [
    { source: { id: "A" }, target: { id: "B" }, capacity: 10, flow: 0 },
    { source: { id: "B" }, target: { id: "A" }, capacity: 2, flow: 0 },
    { source: { id: "B" }, target: { id: "C" }, capacity: 5, flow: 0 },
    { source: { id: "C" }, target: { id: "B" }, capacity: 2, flow: 0 }
  ]
);

interface Algorithm {
  name: string;
  pseudocode: string;
  implementation: (graph: FlowGraph) => Generator<never, void, unknown>;
}

const App: React.FC = () => {
  const [algorithmName, setAlgorithmName] = useState("Edmonds-Karp");
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  useEffect(() => {
    import(`./algorithms/${algorithmName}.ts`).then(mod =>
      setAlgorithm(mod.default)
    );
  }, [algorithmName, setAlgorithm]);
  const [
    algorithmImplementationInstance,
    setAlgorithmImplementationInstance
  ] = useState<Generator | null>(null);
  useEffect(() => {
    algorithm &&
      setAlgorithmImplementationInstance(algorithm.implementation(graph));
  }, [algorithm, graph]);
  const [visualisations, setVisualisations] = useState<Visualisation[]>([]);
  useInterval(
    () => {
      if (!algorithmImplementationInstance) return;
      const nextVisualisations = algorithmImplementationInstance.next().value;
      console.log(nextVisualisations);
      setVisualisations(nextVisualisations || []);
    },
    1000,
    [algorithmImplementationInstance]
  );

  if (algorithm === null) return null;

  return (
    <div className="app">
      <GraphVisualisation graph={graph} visualisations={visualisations} />
      <Pseudocode algorithm={algorithm} />
    </div>
  );
};

export default App;
