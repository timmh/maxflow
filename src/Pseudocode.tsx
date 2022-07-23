import React, { useRef, useEffect } from "react";
import pseudocode from "pseudocode";
import styleVariables from "./variables.scss";
import { Algorithm, AlgorithmPseudocodeArgs } from "./algorithm";

/**
 * The Pseudocode component shows the latex pseudocode listing
 *
 * @param props component props
 * @param props.algorithm the selected [[Algorithm]]
 * @param props.highlightedLines the line numbers which should be highlighted
 */
const Pseudocode: React.FC<{
  algorithm: Algorithm;
  highlightedLines: number[][];
  algorithmPseudocodeArgs: AlgorithmPseudocodeArgs;
}> = ({ algorithm, highlightedLines, algorithmPseudocodeArgs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";

    pseudocode.render(algorithm.pseudocode(algorithmPseudocodeArgs), el, {
      lineNumber: true
      // noEnd: true
    });
  }, [algorithm, algorithmPseudocodeArgs]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.querySelectorAll(".ps-line").forEach(element => {
      for (let t = 0; t < styleVariables.highlightedLinesCount; t++) {
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
        if (labeledBlock.color && i + 1 >= labeledBlock.lines[0] && i < labeledBlock.lines[1]) {
          (line as HTMLElement).style.setProperty(
            "--block-color",
            labeledBlock.color
          );
        }
      });
    });
  });

  return (
    <div className="pseudocode">
      <div ref={containerRef} />
    </div>
  );
};

export default Pseudocode;
