import React from "react";
import { Node } from "./CytoscapeGraph";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const modeToName = {
  queue: "Queue",
  stack: "Stack"
};

const modeToVariable = {
  queue: "q",
  stack: "u"
};

const NodeQueueStackVisualization = ({
  nodes,
  mode
}: {
  nodes: Node[];
  mode: "queue" | "stack";
}) => {
  return (
    <div className="node-queue-stack-visualization">
      <span className="node-queue-stack-visualization__title">{`${modeToName[mode]} ${modeToVariable[mode]} = `}</span>
      <div className="node-queue-stack-visualization__elements">
        <div className="node-queue-stack-visualization__elements-front">
          <div className="node-queue-stack-visualization__element">
            {mode === "queue" && (
              <FontAwesomeIcon
                size="sm"
                icon={faArrowLeft}
                style={{ margin: "0.2em" }}
              />
            )}
            {mode === "queue" ? "out" : "bottom"}
          </div>
          {nodes.map(node => (
            <div
              key={node.getId()}
              className="node-queue-stack-visualization__element"
            >
              <div
                className={`node-queue-stack-visualization__label node-queue-stack-visualization__label--type-${node.getType()}`}
              >
                {node.getLabel()}
              </div>
            </div>
          ))}
        </div>
        <div className="node-queue-stack-visualization__elements-back">
          <div className="node-queue-stack-visualization__element">
            {mode === "queue" && (
              <FontAwesomeIcon
                size="sm"
                icon={faArrowLeft}
                style={{ margin: "0.2em" }}
              />
            )}
            {mode === "queue" ? "in" : "top"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeQueueStackVisualization;
