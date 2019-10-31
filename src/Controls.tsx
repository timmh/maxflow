import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStepForward,
  faUndo
} from "@fortawesome/free-solid-svg-icons";

const Controls: React.FC<{
  state: "stopped" | "auto" | "manual";
  setState: (state: "stopped" | "auto" | "manual") => void;
  stepForward: () => void;
  reset: () => void;
}> = ({ state, setState, stepForward, reset }) => {
  return (
    <div className="controls">
      {state !== "auto" ? (
        <button
          title="Start"
          className="controls__button"
          onClick={() => setState("auto")}
        >
          <FontAwesomeIcon size="2x" icon={faPlay} />
        </button>
      ) : (
        <button
          title="Pause"
          className="controls__button"
          onClick={() => setState("manual")}
        >
          <FontAwesomeIcon size="2x" icon={faPause} />
        </button>
      )}
      <button
        title="Step Forward"
        className="controls__button"
        onClick={() => stepForward()}
        disabled={state === "auto"}
      >
        <FontAwesomeIcon size="2x" icon={faStepForward} />
      </button>
      <button
        title="Reset"
        className="controls__button"
        onClick={() => reset()}
      >
        <FontAwesomeIcon size="2x" icon={faUndo} />
      </button>
    </div>
  );
};

export default Controls;
