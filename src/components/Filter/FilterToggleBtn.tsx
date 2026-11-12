import React from "react";
import { FiFilter } from "react-icons/fi";

type FilterToggleBtnProps = {
  isActive: boolean;
  openFilter: () => void;
  // 적용된 칩 개수 (0이면 배지를 보이지 않는다)
  selectedCount: number;
};

const FilterToggleBtn: React.FC<FilterToggleBtnProps> = ({
  isActive,
  openFilter,
  selectedCount,
}) => {
  return (
    <button
      type="button"
      aria-label="상품 필터 열기"
      className={`
        fixed bottom-3 right-3
        flex justify-center items-center
        w-14 h-14 pt-2
        bg-blue-500
        rounded-full
        z-10 cursor-pointer
        transition-all duration-300 ease-in-out
        ${isActive ? "opacity-0 pointer-events-none" : ""} `}
      onClick={openFilter}
    >
      <FiFilter className="w-[30px] h-[30px] text-white" />
      {selectedCount > 0 && (
        <span
          data-testid="filter-badge"
          className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 flex items-center justify-center text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full"
        >
          {selectedCount}
        </span>
      )}
    </button>
  );
};

export default FilterToggleBtn;
