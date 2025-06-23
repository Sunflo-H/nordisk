import React from "react";

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
    className={`filter-toggle bg-slate-200 w-20 h-20  ${isActive ? "hidden" : ""} `}
      onClick={toggleFilter}
    ></div>
  );
};

export default FilterToggleBtn;
