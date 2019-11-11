import React from "react";

const QueueVisualization = (
  { elements }: { elements: any[] } = { elements: [] }
) => {
  return (
    <div className="queue-visualization">
      <span className="queue-visualization__title">Queue q = </span>
      <div className="queue-visualization__elements">
        {elements.map((element, i) => (
          <div key={i} className="queue-visualization__element">
            <div
              className={`queue-visualization__label queue-visualization__label--type-${element.type}`}
            >
              {element.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueueVisualization;
