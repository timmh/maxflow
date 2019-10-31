import React, { useEffect, useState } from "react";
import GraphVisualisation, {
  Visualisation,
  VisRef
} from "./GraphVisualisation";
import "./App.scss";
import FlowGraph from "./FlowGraph";
import Pseudocode from "./Pseudocode";
import Controls from "./Controls";
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

interface Algorithm {
  name: string;
  pseudocode: string;
  implementation: (vis: VisRef) => Generator<never, void, unknown>;
  cleanup: (vis: VisRef) => void;
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
    highlightedLines: number[];
  }> | null>(null);
  const [algorithmState, setAlgorithmState] = useState<
    "stopped" | "auto" | "manual"
  >("stopped");
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [visRef, setVisRef] = useState<VisRef | null>(null);

  useEffect(() => {
    algorithm &&
      visRef &&
      setAlgorithmImplementationInstance(algorithm.implementation(visRef));
  }, [algorithm, visRef]);

  const stepForward = () => {
    if (!algorithmImplementationInstance) return;
    const result = algorithmImplementationInstance.next();
    if (!result || result.done) {
      setAlgorithmState("stopped");
      // setHighlightedLines([]);
    } else {
      const { highlightedLines } = result.value;
      setHighlightedLines(highlightedLines);
    }
  };

  const reset = () => {
    setAlgorithmState("stopped");
    setHighlightedLines([]);
    if (algorithm && visRef) {
      algorithm.cleanup(visRef);
      setAlgorithmImplementationInstance(algorithm.implementation(visRef));
    }
  };

  useInterval(
    () => {
      if (algorithmState === "auto") stepForward();
    },
    1000,
    [algorithmImplementationInstance, algorithmState]
  );

  if (algorithm === null) return null;

  return (
    <div className="app">
      <div className="app__left">
        <GraphVisualisation
          graph={graph}
          visRef={(nextVisRef: any) => {
            if (nextVisRef !== visRef) setVisRef(nextVisRef);
          }}
          disableInteraction={algorithmState !== "stopped"}
        />
      </div>
      <div className="app__right">
        <Controls
          state={algorithmState}
          setState={setAlgorithmState}
          stepForward={stepForward}
          reset={reset}
        />
        <Pseudocode algorithm={algorithm} highlightedLines={highlightedLines} />
      </div>
    </div>
  );
};

export default App;
