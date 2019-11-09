import React, { useEffect, useState, useCallback } from "react";
import GraphVisualisation, { VisRef } from "./GraphVisualisation";
import "./App.scss";
import Pseudocode from "./Pseudocode";
import Controls from "./Controls";
import useInterval from "./utils/useInterval";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { tgf2cyto } from "./utils/io";

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

  const importGraph = (tgf: String) => {
    if (!visRef) return;

    const elements = tgf2cyto(tgf);

    visRef.cy.json({ elements });
    visRef.resetLayout();
  };

  const onDrop = useCallback(
    (acceptedFiles: Blob[]) => {
      if (acceptedFiles.length !== 1) {
        Swal.fire("Error", "Can only import a single graph at a time", "error");
        return;
      }

      if (algorithmState !== "stopped") {
        Swal.fire(
          "Error",
          "Can only import a graph if visualization is stopped",
          "error"
        );
        return;
      }

      const reader = new FileReader();
      reader.onabort = () =>
        Swal.fire("Error", "File reading was aborted", "error");
      reader.onerror = () =>
        Swal.fire("Error", "File reading has failed", "error");
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          Swal.fire("Error", "File reading has failed", "error");
        } else {
          try {
            importGraph(reader.result);
          } catch (err) {
            Swal.fire("Error", `Parsing error: ${err.toString()}`, "error");
          }
        }
      };
      reader.readAsText(acceptedFiles[0]);
    },
    [algorithmState, visRef]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  if (algorithm === null) return null;

  return (
    <div className="app" {...getRootProps()} onClick={() => undefined}>
      <input {...getInputProps()} />
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
