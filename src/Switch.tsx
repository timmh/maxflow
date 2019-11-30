import React from "react";

/**
 * Each choice has a user-facing label and an internal value
 */
interface Choice {
  value: string;
  label: string;
}

/**
 * A generic Switch component
 *
 * @param props component props
 * @param props.choices a list of available [[Choice]]
 * @param props.onChoose called when a [[Choice]] is made
 */
const Switch: React.FC<{
  choices: Choice[];
  activeChoice?: string;
  onChoose: (value: string) => void;
}> = ({ choices = [], activeChoice, onChoose }) => (
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

export default Switch;
