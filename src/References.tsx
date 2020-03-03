import React from "react";

/**
 * Provides a listing of references for the selected algorithm
 *
 * @param props component props
 * @param props.references the references to be shown
 */
const References = ({
  references
}: {
  references: { label: string; url: string }[];
}) => {
  return (
    <div className="references">
      <h2>Sources & Further Reading</h2>
      <ul className="references__list">
        {references.map(({ label, url }) => (
          <li className="references__item">
            <a href={url}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default References;
