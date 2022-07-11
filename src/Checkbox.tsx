import React from "react";

const Checkbox: React.FunctionComponent<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}> = ({ checked, onChange, children }) => (
  <label className="checkbox" onClick={() => onChange(!checked)}>
    <input
      type="checkbox"
      checked={checked}
      onChange={evt => onChange(evt.target.checked)}
    />
    {children}
  </label>
);

export default Checkbox;
