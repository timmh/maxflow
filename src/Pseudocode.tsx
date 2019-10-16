import React, { useRef, useEffect } from "react";

// pseudocode.js has no type definitions, therefore the interface is declared here
declare global {
  const pseudocode: {
    render: (pseudocode: string, el: HTMLElement, options: Object) => void;
  };
}

const Pseudocode: React.FC<{
  algorithm: { pseudocode: string };
  highlightedLines: number[];
}> = ({ algorithm, highlightedLines }) => {
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll(".ps-line").forEach((line, i) => {
      if (highlightedLines.includes(i + 1)) {
        line.classList.add("ps-line--highlighted");
      } else {
        line.classList.remove("ps-line--highlighted");
      }
    });
  }, [algorithm, highlightedLines]);

  return (
    <div className="pseudocode">
      <div ref={containerRef} />
    </div>
  );
};

export default Pseudocode;
