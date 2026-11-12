import React from "react";
import { IoClose } from "react-icons/io5";
import type { FilterOptionsType } from "../../types";
import FilterOption from "./FilterOption";
import FIlterBlackBox from "./FilterBlackBox";
import type { FilterOptionCounts } from "./Filter";
import {
  categoryOptions,
  emptyFilterOptions,
  genderOptions,
  yearOptions,
} from "../../utils/productFilter";

type FilterOverlayProps = {
  isActive: boolean;
  // 적용 없이 닫기 (X·어두운 배경)
  closeFilter: () => void;
  applyFilter: () => void;
  // 패널에서 고르는 중인 값 (적용 전)
  draftOptions: FilterOptionsType;
  setDraftOptions: React.Dispatch<React.SetStateAction<FilterOptionsType>>;
  optionCounts: FilterOptionCounts;
};

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isActive,
  closeFilter,
  applyFilter,
  draftOptions,
  setDraftOptions,
  optionCounts,
}) => {
  // 항목 하나의 칩을 켜고 끈다
  const toggleOption = (key: keyof FilterOptionsType) => (option: string) => {
    setDraftOptions((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((value) => value !== option)
        : [...prev[key], option],
    }));
  };

  const handleResetFilters = () => {
    setDraftOptions(emptyFilterOptions);
  };

  return (
    <div className="max-w-100vw sm:max-w[320px]">
      <FIlterBlackBox isActive={isActive} onClose={closeFilter} />
      <div
        className={`
          fixed bottom-0 left-0 right-0
          w-screen max-w-screen min-w-0 max-h-screen
          aw:max-w-[420px] aw:min-w-[320px]
          m-auto
          aw:p-[4px]? 
          bg-white
          rounded-t-2xl
          shadow-lg
          z-20
          transition-transform duration-300 ease-in-out
          overflow-scroll
          ${
            isActive
              ? "translate-y-0 pointer-events-auto"
              : "translate-y-full pointer-events-auto"
          }
      `}
      >
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-gray-200 ">
          <div className=" font-bold text-2xl">상품 필터</div>
          <div className="cursor-pointer" onClick={closeFilter}>
            <IoClose className=" font-bold text-4xl" />
          </div>
        </div>

        <FilterOption
          title="연도"
          options={yearOptions}
          selectedOptions={draftOptions.year}
          onToggle={toggleOption("year")}
          counts={optionCounts.year}
        />
        <FilterOption
          title="성별"
          options={genderOptions}
          selectedOptions={draftOptions.gender}
          onToggle={toggleOption("gender")}
          counts={optionCounts.gender}
        />
        <FilterOption
          title="카테고리"
          options={categoryOptions}
          selectedOptions={draftOptions.category}
          onToggle={toggleOption("category")}
          counts={optionCounts.category}
        />

        <div className="flex justify-center items-center p-4 ">
          <div
            className="w-1/2 py-3 mr-4
            bg-white
            text-gray-500 text-center  
            rounded border border-gray-300 
            transition-colors duration-200 cursor-pointer 
            hover:border-blue-600 hover:text-blue-500 "
            onClick={handleResetFilters}
          >
            초기화
          </div>
          <div
            className="w-1/2 py-3 
            bg-blue-500 
            text-white text-center rounded 
            transition-colors duration-200 cursor-pointer
            hover:bg-blue-600"
            onClick={applyFilter}
          >
            적용
          </div>
        </div>
      </div>
    </div>
  );
};
export default FilterOverlay;
