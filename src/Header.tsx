import React, { useRef, CSSProperties, useEffect, useCallback } from "react";

const width = 100;
const height = 50;
const nPoints = 150;
const margin = 50;
const magnitude = height / 5;
const arrowDx = 12.5;
const arrowDy = 12.5;
const dt = 0.5;
const eps = 1e-3;

const strokeStyle: CSSProperties = {
  stroke: "#000000",
  strokeWidth: "3px",
  strokeLinecap: "round",
  fill: "none"
};

const Header = () => {
  const waveRef = useRef<SVGPathElement>(null);
  const animate = useRef(false);
  const tRef = useRef(0);
  const dtRef = useRef(0);

  const nextFrame = useCallback(() => {
    if (!waveRef.current) return;

    const path =
      "M" +
      [...Array(nPoints).keys()]
        .map(i => {
          const c = Math.min(1, Math.pow(Math.min(i, nPoints - i) / margin, 2));
          const x = i * ((width * 0.8) / nPoints) + 0.1 * width;
          const y =
            height / 2 + c * magnitude * Math.sin((i + 2 + tRef.current) / 10);
          return `${x},${y}`;
        })
        .join(" L");

    waveRef.current.setAttribute("d", path);

    if (animate.current) {
      dtRef.current = Math.min(dt, Math.max(0.1, dtRef.current) * 1.1);
    } else {
      dtRef.current *= 0.95;
    }
    if (dtRef.current > eps) {
      tRef.current += dtRef.current;
      requestAnimationFrame(nextFrame);
    } else {
      dtRef.current = 0;
    }
  }, []);

  useEffect(() => {
    nextFrame();
  }, [nextFrame]);

  return (
    <div
      className="header"
      onMouseEnter={() => {
        animate.current = true;
        if (dtRef.current === 0) {
          nextFrame();
        }
      }}
      onMouseLeave={() => {
        animate.current = false;
      }}
    >
      <svg className="header__icon" viewBox={`${0} ${0} ${width} ${height}`}>
        <path ref={waveRef} style={strokeStyle} d=""></path>
        <path
          style={strokeStyle}
          d={[
            `M${0.1 * width},${height / 2} l${arrowDx},${-arrowDy}`,
            `M${0.1 * width},${height / 2} l${arrowDx},${arrowDy}`,
            `M${0.9 * width},${height / 2} l${-arrowDx},${-arrowDy}`,
            `M${0.9 * width},${height / 2} l${-arrowDx},${arrowDy}`
          ].join(" ")}
        ></path>
      </svg>
      <h1>Maxflow Algorithm Visualization</h1>
    </div>
  );
};

export default Header;
