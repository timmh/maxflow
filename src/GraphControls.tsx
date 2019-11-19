import React from "react";
import Switch from "./Switch";

export type GraphDisplayState = "flow" | "residual" | "original_flow";

const GraphControls = ({
  autoLayout,
  setAutoLayout,
  onImport,
  onExport,
  onExportPng,
  graphDisplayState,
  setGraphDisplayState
}: {
  autoLayout: boolean;
  setAutoLayout: (autoLayout: boolean) => void;
  onImport: () => void;
  onExport: () => void;
  onExportPng: () => void;
  graphDisplayState: GraphDisplayState;
  setGraphDisplayState: (graphDisplayState: GraphDisplayState) => void;
}) => {
  return (
    <div className="graph-controls">
      <label>
        <input
          type="checkbox"
          checked={autoLayout}
          onChange={evt => setAutoLayout(evt.target.checked)}
        />
        Autolayout
      </label>
      <button onClick={() => onImport()}>Import</button>
      <button onClick={() => onExport()}>Export</button>
      <button onClick={() => onExportPng()}>Export PNG</button>
      <Switch
        choices={[
          { value: "flow", label: "Flow" },
          { value: "residual", label: "Residual" },
          { value: "original_flow", label: "Original" }
        ]}
        activeChoice={graphDisplayState}
        onChoose={(graphDisplayState: string) =>
          setGraphDisplayState(graphDisplayState as GraphDisplayState)
        }
      />
    </div>
  );
};

export default GraphControls;
