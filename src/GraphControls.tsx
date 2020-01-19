import React from "react";
import Switch from "./Switch";

export type GraphDisplayState = "flow" | "residual" | "original_flow";

/**
 * The GraphControls component renders graph display options
 * and I/O actions
 *
 * @param props component props
 * @param props.autoLayout whether the layout runs continuously
 * @param props.setAutoLayout updates the autoLayout prop
 * @param props.onImport called when the import button is pressed
 * @param props.onExport called when the export button is pressed
 * @param props.onExportPng called when the export PNG button is pressed
 * @param props.setGraphDisplayState updates the [[GraphDisplayState]]
 */
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
      <div>
        <button onClick={() => onImport()}>Import</button>
        <button onClick={() => onExport()}>Export</button>
        <button onClick={() => onExportPng()}>Export PNG</button>
      </div>
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
