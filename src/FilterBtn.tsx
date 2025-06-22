import React from "react";
import "./Filter.css";

type FilterBtnProps = {
  toggleFilter: () => void;
};

const FilterBtn: React.FC<FilterBtnProps> = ({ toggleFilter }) => {
  return (
    <button
      className="filter-toggle"
      id="filterToggleBtn"
      onClick={toggleFilter}
    ></button>
  );
};

export default FilterBtn;
