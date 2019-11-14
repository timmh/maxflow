import React from "react";

const GraphControls = ({
  autoLayout,
  setAutoLayout,
  onImport,
  onExport,
  onExportPng
}: {
  autoLayout: boolean;
  setAutoLayout: (autoLayout: boolean) => void;
  onImport: () => void;
  onExport: () => void;
  onExportPng: () => void;
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
    </div>
  );
};

export default GraphControls;
