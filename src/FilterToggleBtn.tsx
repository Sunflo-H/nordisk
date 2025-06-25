import React from "react";
import { FiFilter } from "react-icons/fi";

type FilterToggleBtnProps = {
  isActive: boolean;
  toggleFilter: () => void;
};

const FilterToggleBtn: React.FC<FilterToggleBtnProps> = ({
  isActive,
  toggleFilter,
}) => {
  return (
    <div
      className={`filter-toggle ${isActive ? "active" : ""} `}
      onClick={toggleFilter}
    >
      <FiFilter className="filter-icon" />
    </div>
  );
};

export default FilterToggleBtn;
