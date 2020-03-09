import React, { useState, useCallback } from "react";

const Dropdown: React.FunctionComponent<{
  title: string;
  size: "s" | "m" | "l";
}> = ({ title, size, children }) => {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open]);

  return (
    <div className={`dropdown dropdown--size-${size}`}>
      <button
        className="dropdown__button"
        onClick={evt => {
          evt.stopPropagation();
          evt.preventDefault();
          toggle();
        }}
      >
        <span></span>
        <span>{title}</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          className="dropdown__content"
          onClick={evt => {
            evt.stopPropagation();
            evt.preventDefault();
            toggle();
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
