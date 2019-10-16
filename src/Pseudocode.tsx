import React, { useRef, useEffect } from "react";

// pseudocode.js has no type definitions, therefore the interface is declared here
declare global {
  const pseudocode: {
    render: (pseudocode: string, el: HTMLElement, options: Object) => void;
  };
}

const Pseudocode: React.FC<{ algorithm: { pseudocode: string } }> = ({
  algorithm
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    pseudocode.render(algorithm.pseudocode, el, {
      lineNumber: true
      // noEnd: true
    });
  }, [algorithm]);

  return (
    <div className="pseudocode">
      <div ref={containerRef} />
    </div>
  );
};

export default Pseudocode;
