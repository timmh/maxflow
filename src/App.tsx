import React, { useEffect, useState, useCallback } from "react";
import "./App.scss";
import Pseudocode from "./Pseudocode";
import NodeQueueVisualization from "./NodeQueueVisualization";
import Controls from "./Controls";
import useInterval from "./utils/useInterval";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { tgf2cyto, cyto2tgf } from "./utils/io";
import assertValidGraph from "./utils/assertValidGraph";
import GraphControls, { GraphDisplayState } from "./GraphControls";
import FileSaver from "file-saver";
import config from "./config";
import { Graph, GraphMutation, Node } from "./CytoscapeGraph";
import GraphVisualization from "./GraphVisualization";

interface Algorithm {
  name: string;
  pseudocode: string;
  labeledBlocks: { lines: [number, number]; color: string; label: string }[];
  implementation: (graph: Graph) => Generator<never, void, unknown>;
}

interface AlgorithmStepResult {
  highlightedLines: number[];
  queueNodes: Node[];
  graphMutations: GraphMutation[];
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
  ] = useState<Generator<AlgorithmStepResult> | null>(null);
  const [algorithmState, setAlgorithmState] = useState<
    "stopped" | "auto" | "manual" | "finished"
  >("stopped");
  const [highlightedLines, setHighlightedLines] = useState<number[][]>([]);
  const queueHighlightedLines = (newHighlightedLines: number[]) => {
    setHighlightedLines([
      newHighlightedLines,
      ...highlightedLines.slice(0, config.highlightedLinesCount - 1)
    ]);
  };
  const [queueNodes, setQueueNodes] = useState<any[]>([]);
  const [visRef, setVisRef] = useState<GraphVisualization | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [autoLayout, setAutoLayout] = useState(true);
  const [stepBackwardBuffer, setStepBackwardBuffer] = useState<
    AlgorithmStepResult[]
  >([]);
  const [stepBackwardBufferIndex, setStepBackwardBufferIndex] = useState(-1);

  useEffect(() => {
    algorithm &&
      graph &&
      setAlgorithmImplementationInstance(algorithm.implementation(graph));
  }, [algorithm, graph]);

  const [graphDisplayState, setGraphDisplayState] = useState<GraphDisplayState>(
    "flow"
  );

  const stepForward = () => {
    if (!algorithmImplementationInstance || !visRef) return;
    try {
      assertValidGraph(visRef.cy!);
    } catch (err) {
      Swal.fire("Error", err.toString(), "error");
      return;
    }

    let result;
    if (stepBackwardBufferIndex >= stepBackwardBuffer.length - 1) {
      const yieldResult = algorithmImplementationInstance.next();
      if (!yieldResult || yieldResult.done) {
        setAlgorithmState("finished");
      } else {
        result = yieldResult.value;
        setStepBackwardBuffer([...stepBackwardBuffer, yieldResult.value]);
        setStepBackwardBufferIndex(stepBackwardBufferIndex + 1);
      }
    } else {
      result = stepBackwardBuffer[stepBackwardBufferIndex + 1];
      setStepBackwardBufferIndex(stepBackwardBufferIndex + 1);
    }
    if (result) {
      const { highlightedLines, queueNodes, graphMutations } = result;
      if (highlightedLines) queueHighlightedLines(highlightedLines);
      if (queueNodes) setQueueNodes(queueNodes);
      graphMutations.forEach(graphMutation => graphMutation.apply());
    }
  };

  const stepBackward = () => {
    if (!algorithmImplementationInstance || !visRef) return;
    if (stepBackwardBufferIndex === -1) return;
    const currentResult = stepBackwardBuffer[stepBackwardBufferIndex];
    const result = stepBackwardBuffer[stepBackwardBufferIndex - 1];
    setStepBackwardBufferIndex(stepBackwardBufferIndex - 1);
    currentResult.graphMutations
      .slice()
      .reverse()
      .forEach(graphMutation => graphMutation.inverse().apply());
    if (!result) {
      setQueueNodes([]);
      setHighlightedLines([]);
    } else {
      const { highlightedLines, queueNodes, graphMutations } = result;
      if (highlightedLines) setHighlightedLines([highlightedLines]);
      if (queueNodes) setQueueNodes(queueNodes);
    }
  };

  const reset = () => {
    stepBackwardBuffer
      .slice()
      .reverse()
      .forEach(result => {
        result.graphMutations
          .slice()
          .reverse()
          .forEach(graphMutation => graphMutation.inverse().apply());
      });
    setAlgorithmState("stopped");
    setHighlightedLines([]);
    setQueueNodes([]);
    setStepBackwardBuffer([]);
    setStepBackwardBufferIndex(-1);
    setHighlightedLines([]);
    if (algorithm && graph) {
      setAlgorithmImplementationInstance(algorithm.implementation(graph));
    }
  };

  useInterval(
    () => {
      if (algorithmState === "auto" && visRef) {
        try {
          assertValidGraph(visRef.cy!);
        } catch (err) {
          Swal.fire("Error", err.toString(), "error");
          reset();
          return;
        }
        stepForward();
      }
    },
    1000,
    [algorithmImplementationInstance, algorithmState, setAlgorithmState]
  );

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
            const elements = tgf2cyto(reader.result);
            visRef!.cy!.json({ elements });
            visRef!.resetLayout();
          } catch (err) {
            Swal.fire("Error", `Parsing error: ${err.toString()}`, "error");
          }
        }
      };
      reader.readAsText(acceptedFiles[0]);
    },
    [algorithmState, visRef]
  );
  const { getRootProps, getInputProps, open: openDropzone } = useDropzone({
    onDrop,
    noClick: true
  });

  if (algorithm === null) return null;

  return (
    <div className="app" {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="app__left">
        <GraphControls
          autoLayout={autoLayout}
          setAutoLayout={setAutoLayout}
          onImport={() => openDropzone()}
          onExport={() =>
            visRef &&
            FileSaver.saveAs(
              new Blob([cyto2tgf(visRef.cy!)], {
                type: "text/plain;charset=utf-8"
              }),
              "graph.tgf",
              { autoBom: true }
            )
          }
          onExportPng={() => {
            if (!visRef) return;
            visRef.edgehandles.hide();
            FileSaver.saveAs(
              visRef.cy!.png({ output: "blob", full: true, scale: 10 }),
              "graph.png"
            );
          }}
          graphDisplayState={graphDisplayState}
          setGraphDisplayState={setGraphDisplayState}
        />
        <GraphVisualization
          visualizationRef={nextVisualizationRef => {
            setVisRef(nextVisualizationRef);
            setGraph(new Graph(nextVisualizationRef.cy!));
          }}
          disableInteraction={algorithmState !== "stopped"}
          autoLayout={autoLayout}
          graphDisplayState={graphDisplayState}
        />
      </div>
      <div className="app__right">
        <Controls
          state={algorithmState}
          setState={setAlgorithmState}
          stepBackward={stepBackwardBufferIndex > -1 ? stepBackward : undefined}
          stepForward={algorithmState !== "finished" ? stepForward : undefined}
          reset={reset}
        />
        <Pseudocode algorithm={algorithm} highlightedLines={highlightedLines} />
        <NodeQueueVisualization nodes={queueNodes} />
      </div>
    </div>
  );
};

export default App;
