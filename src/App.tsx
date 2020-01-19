import React, { useEffect, useState, useCallback } from "react";
import "./App.scss";
import Pseudocode from "./Pseudocode";
import NodeQueueStackVisualization from "./NodeQueueStackVisualization";
import Controls from "./Controls";
import useInterval from "./utils/useInterval";
import { useDropzone } from "react-dropzone";
import Swal from "sweetalert2";
import { tgf2cyto, cyto2tgf } from "./utils/io";
import assertValidGraph from "./utils/assertValidGraph";
import GraphControls, { GraphDisplayState } from "./GraphControls";
import FileSaver from "file-saver";
import { Graph } from "./CytoscapeGraph";
import GraphVisualization from "./GraphVisualization";
import * as styleVariables from "./variables.scss";
import useQueue from "./utils/useQueue";
import algorithms from "./algorithms";
import Footer from "./Footer";
import Joyride from "react-joyride";
import {
  Algorithm,
  AlgorithmStepResult,
  AlgorithmPseudocodeArgs
} from "./algorithm";

// the "empty" step result, shown before the algorithm is run
const initialStepResult = {
  highlightedLines: [],
  linearNodes: [],
  graphMutations: []
};

// code for loading and persisting preferences in localStorage
const preferencesKey = "maxflow_preferences";
const preferences = {
  algorithmName: algorithms[0].filename,
  autoLayout: true,
  graphDisplayState: "flow" as GraphDisplayState
};
try {
  Object.assign(preferences, JSON.parse(localStorage.getItem(preferencesKey)!));
} catch (err) {
  localStorage.removeItem(preferencesKey);
}
const setPreferences = (preferences: Object) => {
  localStorage.setItem(preferencesKey, JSON.stringify(preferences));
};

/**
 * The App component is responsible for maintaining the
 * high-level state of the application
 */
const App: React.FC = () => {
  const [visRef, setVisRef] = useState<GraphVisualization | null>(null);
  const [algorithmName, setAlgorithmName] = useState(preferences.algorithmName);
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  useEffect(() => {
    import(`./algorithms/${algorithmName}.ts`).then(mod =>
      setAlgorithm(mod.default)
    );
  }, [algorithmName, setAlgorithm]);
  const [
    algorithmImplementationInstance,
    setAlgorithmImplementationInstance
  ] = useState<IterableIterator<AlgorithmStepResult> | null>(null);
  const resetAlgorithm = () => {
    if (algorithm && visRef && visRef.cy) {
      setAlgorithmImplementationInstance(
        algorithm.implementation(new Graph(visRef.cy))
      );
    }
  };
  useEffect(resetAlgorithm, [algorithm, visRef]);
  const [algorithmState, setAlgorithmState] = useState<
    "stopped" | "auto" | "manual" | "finished"
  >("stopped");
  const [autoLayout, setAutoLayout] = useState(preferences.autoLayout);
  const [graphDisplayState, setGraphDisplayState] = useState<GraphDisplayState>(
    preferences.graphDisplayState
  );

  const {
    queue: highlightedLines,
    enqueue: enqueueHighlightedLines,
    reset: resetHighlightedLines
  } = useQueue<number[]>(
    initialStepResult.highlightedLines,
    styleVariables.highlightedLinesCount
  );

  const [stepBackwardBuffer, setStepBackwardBuffer] = useState<
    AlgorithmStepResult[]
  >([initialStepResult]);
  const [stepBackwardBufferIndex, setStepBackwardBufferIndex] = useState(0);
  const { linearNodes } = stepBackwardBuffer[stepBackwardBufferIndex];
  const [algorithmPseudocodeArgs, setAlgorithmPseudocodeArgs] = useState<
    AlgorithmPseudocodeArgs
  >({ sourceName: "s", sinkName: "t" });

  const [showTour, setShowTour] = useState(false);

  const stepForward = () => {
    if (!algorithmImplementationInstance || !visRef) return;
    try {
      assertValidGraph(visRef.cy!);
    } catch (err) {
      Swal.fire("Error", err.toString(), "error");
      return;
    }

    let result: AlgorithmStepResult;
    if (stepBackwardBufferIndex >= stepBackwardBuffer.length - 1) {
      const yieldResult = algorithmImplementationInstance.next();
      result = yieldResult.value;
      setStepBackwardBuffer([...stepBackwardBuffer, yieldResult.value]);
      setStepBackwardBufferIndex(stepBackwardBufferIndex + 1);
    } else {
      result = stepBackwardBuffer[stepBackwardBufferIndex + 1];
      setStepBackwardBufferIndex(stepBackwardBufferIndex + 1);
    }
    if (result) {
      const { highlightedLines = [], graphMutations = [], done } = result;
      if (done) {
        setAlgorithmState("finished");
      }
      enqueueHighlightedLines(highlightedLines);
      visRef.cy!.batch(() => {
        graphMutations.forEach(graphMutation => graphMutation.apply());
      });
    }
  };

  const stepBackward = () => {
    if (!algorithmImplementationInstance || !visRef) return;
    if (stepBackwardBufferIndex === -1) return;
    const currentResult = stepBackwardBuffer[stepBackwardBufferIndex];
    const result = stepBackwardBuffer[stepBackwardBufferIndex - 1];
    setStepBackwardBufferIndex(stepBackwardBufferIndex - 1);
    visRef.cy!.batch(() => {
      (currentResult.graphMutations || [])
        .slice()
        .reverse()
        .forEach(graphMutation => graphMutation.inverse().apply());
    });
    const { highlightedLines = [] } = result;
    resetHighlightedLines([highlightedLines]);
  };

  const reset = () => {
    if (!visRef || !visRef.cy) return;
    visRef.cy.batch(() => {
      stepBackwardBuffer
        .slice()
        .reverse()
        .forEach(result => {
          (result.graphMutations || [])
            .slice()
            .reverse()
            .forEach(graphMutation => graphMutation.inverse().apply());
        });
      visRef.cy!.$(".graph-node").removeData("height excess");
    });
    setAlgorithmState("stopped");
    resetHighlightedLines([]);
    setStepBackwardBuffer([initialStepResult]);
    setStepBackwardBufferIndex(0);
    resetAlgorithm();
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
    styleVariables.autoStepInterval,
    [algorithmImplementationInstance, algorithmState, setAlgorithmState]
  );

  const handleVisChange = useCallback(() => {
    if (!visRef || !visRef.cy) return;

    setAlgorithmPseudocodeArgs({
      sourceName:
        visRef?.cy?.nodes('.graph-node[type="source"]')[0]?.data("label") ??
        "s",
      sinkName:
        visRef?.cy?.nodes('.graph-node[type="sink"]')[0]?.data("label") ?? "t"
    });
  }, [visRef]);

  useEffect(() => {
    handleVisChange();
  }, [handleVisChange]);

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
          setAutoLayout={autoLayout => {
            setAutoLayout(autoLayout);
            setPreferences({ ...preferences, autoLayout });
          }}
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
          setGraphDisplayState={(graphDisplayState: GraphDisplayState) => {
            setGraphDisplayState(graphDisplayState);
            setPreferences({ ...preferences, graphDisplayState });
          }}
        />
        <GraphVisualization
          visualizationRef={nextVisualizationRef => {
            setVisRef(nextVisualizationRef);
          }}
          onChange={() => handleVisChange()}
          disableInteraction={algorithmState !== "stopped"}
          autoLayout={autoLayout}
          graphDisplayState={graphDisplayState}
        />
      </div>
      <div className="app__right">
        <div className="header" />
        <Controls
          state={algorithmState}
          setState={setAlgorithmState}
          stepBackward={stepBackwardBufferIndex > -1 ? stepBackward : undefined}
          stepForward={algorithmState !== "finished" ? stepForward : undefined}
          reset={reset}
          algorithms={algorithms.map(({ label, filename }) => ({
            label,
            value: filename
          }))}
          currentAlgorithm={algorithmName}
          setCurrentAlgorithm={algorithmName => {
            setAlgorithmName(algorithmName);
            setPreferences({ ...preferences, algorithmName });
          }}
        />
        <Pseudocode
          algorithm={algorithm}
          highlightedLines={highlightedLines}
          algorithmPseudocodeArgs={algorithmPseudocodeArgs}
        />
        {algorithm.linearDataStructure !== "none" ? (
          <NodeQueueStackVisualization
            nodes={linearNodes}
            mode={algorithm.linearDataStructure}
          />
        ) : (
          <div className="horizontal-divider" />
        )}
        <Footer
          onTourPressed={() => {
            setShowTour(true);
          }}
        />
      </div>
      <Joyride
        continuous
        run={showTour}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={tourSteps}
      />
    </div>
  );
};

const tourSteps = [
  {
    target: ".graph-visualization__overlay",
    content: `
      This is the flow network view.
      Click/tap and hold to modify nodes and edges.
      When hovering a node, drag the red handle to create new edges.
    `
  },
  {
    target: ".controls__select",
    content: `
      Select an algorithm you wish to visualize
    `
  },
  {
    target: ".controls__buttons",
    content: `
      Use these buttons to step forwards or backwards,
      run to completion or reset the algorithm
    `
  },
  {
    target: ".pseudocode",
    content: `
      This is the pseudocode of your algorithm
    `
  },
  {
    target: ".node-queue-stack-visualization",
    content: `
      Depending on the selected algorithm, secondary data structures
      are visualized here
    `
  },
  {
    target: ".graph-controls",
    content: `
      Use these controls to disable automatic flow network layouting,
      import and export your flow network and switch between
      different flow network presentation options
    `
  }
].map(step => ({ disableBeacon: true, ...step }));

export default App;
