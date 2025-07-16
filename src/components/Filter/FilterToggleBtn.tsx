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
      className={`
        fixed bottom-3 right-3
        flex justify-center items-center
        w-14 h-14 pt-2 
        bg-blue-500 
        rounded-full 
        z-10 cursor-pointer 
        transition-all duration-300 ease-in-out 
        ${isActive ? "opacity-0 pointer-none" : ""} `}
      onClick={toggleFilter}
    >
      <FiFilter className="w-[30px] h-[30px] text-white" />
    </div>
  );
};

export default FilterToggleBtn;
