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
    <button
      className={`bg-blue-500 w-20 h-20  ${isActive ? "hidden" : ""} `}
      onClick={toggleFilter}
    ></button>
  );
};

export default FilterToggleBtn;
