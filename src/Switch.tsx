import React from "react";

interface Choice {
  value: string;
  label: string;
}

const Switch: React.FC<{
  choices: Choice[];
  activeChoice?: string;
  onChoose: (value: string) => void;
}> = ({ choices = [], activeChoice, onChoose }) => (
  <div className="switch">
    {choices.map(choice => (
      <button
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
