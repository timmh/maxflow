import React from "react";
import { Node } from "./CytoscapeGraph";

const NodeQueueVisualization = (
  { nodes }: { nodes: Node[] } = { nodes: [] }
) => {
  return (
    <div className="node-queue-visualization">
      <span className="node-queue-visualization__title">Queue q = </span>
      <div className="node-queue-visualization__elements">
        {nodes.map(node => (
          <div key={node.getId()} className="node-queue-visualization__element">
            <div
              className={`node-queue-visualization__label node-queue-visualization__label--type-${node.getType()}`}
            >
              {node.getLabel()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeQueueVisualization;
