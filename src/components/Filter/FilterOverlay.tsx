import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import type { FilterOptionsType } from "../../types";
import FilterOption from "./FilterOption";
import FIlterBlackBox from "./FilterBlackBox";
import {
  categoryOptions,
  genderOptions,
  yearOptions,
} from "../../utils/productFilter";

type FilterOverlayProps = {
  isActive: boolean;
  toggleFilter: () => void;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptionsType>>;
};

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isActive,
  toggleFilter,
  setFilterOptions,
}) => {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleResetFilters = () => {
    setSelectedGenders([]);
    setSelectedCategories([]);
    setSelectedYears([]);
  };

  const handleActiveFIlter = () => {
    setFilterOptions({
      year: selectedYears,
      gender: selectedGenders,
      category: selectedCategories,
    });
    toggleFilter();
  };

  return (
    <div className="max-w-100vw sm:max-w[320px]">
      <FIlterBlackBox isActive={isActive} />
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
          <div className="cursor-pointer" onClick={toggleFilter}>
            <IoClose className=" font-bold text-4xl" />
          </div>
        </div>

        <FilterOption
          title="연도"
          options={yearOptions}
          selectedOptions={selectedYears}
          setSelectedOptions={setSelectedYears}
        />
        <FilterOption
          title="성별"
          options={genderOptions}
          selectedOptions={selectedGenders}
          setSelectedOptions={setSelectedGenders}
        />
        <FilterOption
          title="카테고리"
          options={categoryOptions}
          selectedOptions={selectedCategories}
          setSelectedOptions={setSelectedCategories}
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
            onClick={handleActiveFIlter}
          >
            적용
          </div>
        </div>
      </div>
    </div>
  );
};
export default FilterOverlay;
