import React, { useRef, useEffect } from "react";
import config from "./config";

// pseudocode.js has no type definitions, therefore the interface is declared here
declare global {
  const pseudocode: {
    render: (pseudocode: string, el: HTMLElement, options: Object) => void;
  };
}

const Pseudocode: React.FC<{
  algorithm: {
    pseudocode: string;
    labeledBlocks: { lines: [number, number]; color: string; label: string }[];
  };
  highlightedLines: number[][];
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
    el.querySelectorAll(".ps-line").forEach(element => {
      for (let t = 0; t < config.highlightedLinesCount; t++) {
        element.classList.remove(`ps-line--highlighted-${t}`);
      }
    });
    el.querySelectorAll(".ps-line").forEach((line, i) => {
      highlightedLines.forEach((highlightedLines, t) => {
        const className = `ps-line--highlighted-${t}`;
        if (highlightedLines.includes(i + 1)) {
          line.classList.add(className);
        } else {
          line.classList.remove(className);
        }
      });
    });
  }, [algorithm, highlightedLines]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll(".ps-line").forEach((line, i) => {
      algorithm.labeledBlocks.forEach(labeledBlock => {
        if (i + 1 === labeledBlock.lines[0]) {
          (line as HTMLElement).setAttribute(
            "data-block-label",
            `// ${labeledBlock.label}`
          );
        }
        if (i + 1 >= labeledBlock.lines[0] && i < labeledBlock.lines[1]) {
          (line as HTMLElement).style.setProperty(
            "--block-color",
            labeledBlock.color
          );
        }
      });
    });
  }, [algorithm]);

  return (
    <div className="pseudocode">
      <div ref={containerRef} />
    </div>
  );
};

export default Pseudocode;
