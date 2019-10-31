import React, { useEffect, useState } from "react";
import GraphVisualisation, { VisRef } from "./GraphVisualisation";
import "./App.scss";
import Pseudocode from "./Pseudocode";
import Controls from "./Controls";
import useInterval from "./utils/useInterval";

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
