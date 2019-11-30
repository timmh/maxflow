import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faPause,
  faStepForward,
  faUndo,
  faStepBackward
} from "@fortawesome/free-solid-svg-icons";

/**
 * The Controls component renders above the pseudocode listing
 * and allows stepping through the algorithm
 *
 * @param props component props
 * @param props.state the current state of the algorithm instance
 * @param props.setState allows setting the current state
 * @param props.stepBackward make one step backwards
 * @param props.stepForward make one step forwards
 * @param props.reset reset the problem instance to the initial state
 * @param props.algorithms a list of algorithms to show in the algorithm selector
 * @param props.currentAlgorithm the `value` of the currently selected algorithm
 * @param props.setCurrentAlgorithm allows selecting another algorithm using it's `value`
 */
const Controls: React.FC<{
  state: "stopped" | "auto" | "manual" | "finished";
  setState: (state: "stopped" | "auto" | "manual" | "finished") => void;
  stepBackward?: () => void;
  stepForward?: () => void;
  reset: () => void;
  algorithms: { value: string; label: string }[];
  currentAlgorithm: string;
  setCurrentAlgorithm: (algorithm: string) => void;
}> = ({
  state,
  setState,
  stepBackward,
  stepForward,
  reset,
  algorithms,
  currentAlgorithm,
  setCurrentAlgorithm
}) => {
  return (
    <div className="controls">
      <div className="controls__buttons">
        <button
          title="Step Backward"
          className="controls__button"
          onClick={() => {
            setState("manual");
            stepBackward && stepBackward();
          }}
          disabled={state === "auto" || !stepBackward}
        >
          <FontAwesomeIcon size="2x" icon={faStepBackward} />
        </button>
        {state !== "auto" ? (
          <button
            title="Start"
            className="controls__button"
            onClick={() => setState("auto")}
            disabled={state === "finished"}
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
          onClick={() => {
            setState("manual");
            stepForward && stepForward();
          }}
          disabled={state === "auto" || !stepForward}
        >
          <FontAwesomeIcon size="2x" icon={faStepForward} />
        </button>
        <button
          title="Reset"
          className="controls__button"
          disabled={state === "stopped"}
          onClick={() => reset()}
        >
          <FontAwesomeIcon size="2x" icon={faUndo} />
        </button>
      </div>
      <div className="controls__select">
        <select
          value={currentAlgorithm}
          onChange={evt => {
            setCurrentAlgorithm(evt.target.value);
          }}
          disabled={state !== "stopped"}
        >
          {algorithms.map(algorithm => (
            <option key={algorithm.value} value={algorithm.value}>
              {algorithm.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Controls;
