import React from "react";

/**
 * Each choice has a user-facing label and an internal value
 */
interface Choice<T> {
  value: T;
  label: string;
}

/**
 * A generic Switch component
 *
 * @param props component props
 * @param props.choices a list of available [[Choice]]
 * @param props.onChoose called when a [[Choice]] is made
 */
function Switch<T extends number | string>({
  choices = [],
  activeChoice,
  onChoose
}: {
  choices: Choice<T>[];
  activeChoice?: T;
  onChoose: (value: T) => void;
}) {
  return (
    <div className="switch">
      {choices.map(choice => (
        <button
          key={choice.value}
          className="switch__button"
          disabled={choice.value === activeChoice}
          onClick={() => onChoose(choice.value)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

export default Switch;
