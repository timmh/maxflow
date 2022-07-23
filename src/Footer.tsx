import React from "react";

const Footer = ({ onTourPressed }: { onTourPressed: () => void }) => (
  <div className="footer">
    <span
      role="button"
      onClick={evt => {
        evt.preventDefault();
        onTourPressed();
      }}
    >
      Take a Tour
    </span>
    {" | "}
    <a href="https://github.com/timmh/maxflow">Code</a>
    {" | "}
    <a href="https://github.com/timmh/maxflow/issues">Feedback</a>
    {" | "}
    <a href="https://timm.haucke.xyz">made by Timm Haucke</a>
  </div>
);

export default Footer;
