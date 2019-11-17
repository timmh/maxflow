import React from "react";
import { Node } from "./CytoscapeGraph";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const NodeQueueVisualization = (
  { nodes }: { nodes: Node[] } = { nodes: [] }
) => {
  return (
    <div className="node-queue-visualization">
      <span className="node-queue-visualization__title">Queue q = </span>
      <div className="node-queue-visualization__elements">
        <div className="node-queue-visualization__elements-front">
          <div className="node-queue-visualization__element">
            <FontAwesomeIcon
              size="sm"
              icon={faArrowLeft}
              style={{ margin: "0.2em" }}
            />
            out
          </div>
          {nodes.map(node => (
            <div
              key={node.getId()}
              className="node-queue-visualization__element"
            >
              <div
                className={`node-queue-visualization__label node-queue-visualization__label--type-${node.getType()}`}
              >
                {node.getLabel()}
              </div>
            </div>
          ))}
        </div>
        <div className="node-queue-visualization__elements-back">
          <div className="node-queue-visualization__element">
            <FontAwesomeIcon
              size="sm"
              icon={faArrowLeft}
              style={{ margin: "0.2em" }}
            />
            in
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeQueueVisualization;
