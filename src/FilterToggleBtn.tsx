import React from "react";
import { FaFilter } from "react-icons/fa";
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
      className={`filter-toggle bg-blue-500 w-20 h-20 flex items-center justify-center${
        isActive ? "hidden" : ""
      } `}
      onClick={toggleFilter}
    >
      <FiFilter className="text-white text-3xl" />
    </div>
  );
};

export default FilterToggleBtn;
