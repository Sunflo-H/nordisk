import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import type { FilterOptionsType } from "../../types";

type FilterOverlayProps = {
  isActive: boolean;
  toggleFilter: () => void;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptionsType>>;
};

const yearOptions = ["2025", "2024", "2023"];
const genderOptions = ["공용", "남성", "여성", "키즈"];
const categoryOptions = [
  "상의",
  "하의",
  "자켓",
  "셔츠",
  "패딩",
  "장갑",
  "신발",
  "모자",
];
const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isActive,
  toggleFilter,
  setFilterOptions,
}) => {
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleGenderClick = (gender: string) => {
    setSelectedGenders((prev) =>
      prev.includes(gender)
        ? prev.filter((g) => g !== gender)
        : [...prev, gender]
    );
  };

  const handleYearClick = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((g) => g !== year) : [...prev, year]
    );
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleResetFilters = () => {
    setSelectedGenders([]);
    setSelectedCategories([]);
  };

  useEffect(() => {
    setFilterOptions({
      year: selectedYears,
      gender: selectedGenders,
      category: selectedCategories,
    });
  }, [selectedYears, selectedGenders, selectedCategories]);

  return (
    <div className="max-w-100vw sm:max-w[320px]">
      <div className={`filter-blackbox ${isActive ? "active" : ""}`}></div>
      <div
        className={`filter-overlay ${isActive ? "active" : ""} 
      `}
      >
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-gray-200 ">
          <div className=" font-bold text-2xl">상품 필터</div>
          <div className="cursor-pointer" onClick={toggleFilter}>
            <IoClose className=" font-bold text-4xl" />
          </div>
        </div>
        <div className="flex flex-col items-center px-4 ">
          <div className="filter-title w-full text-left text-xl font-bold pt-4 pb-3">
            연도
          </div>
          <div className="flex w-full gap-2 flex-wrap pb-8 border-b border-gray-200">
            {yearOptions.map((year) => (
              <div
                key={year}
                className={`cursor-pointer px-4 py-2 rounded-full border border-gray-300 hover:border-blue-500 transition-colors duration-200 ${
                  selectedYears.includes(year)
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => handleYearClick(year)}
              >
                {year}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center px-4 ">
          <div className="filter-title w-full text-left text-xl font-bold pt-4 pb-3">
            성별
          </div>
          <div className="flex w-full gap-2 flex-wrap pb-8 border-b border-gray-200">
            {genderOptions.map((gender) => (
              <div
                key={gender}
                className={`cursor-pointer px-4 py-2 rounded-full border border-gray-300 hover:border-blue-500 transition-colors duration-200 ${
                  selectedGenders.includes(gender)
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => handleGenderClick(gender)}
              >
                {gender}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center px-4 mt-2">
          <div className="filter-title w-full text-left text-xl font-bold pt-4 pb-3">
            상품 종류
          </div>
          <div className="flex w-full gap-2 flex-wrap pb-6 ">
            {categoryOptions.map((category) => (
              <div
                key={category}
                className={`cursor-pointer px-4 py-2 rounded-full border border-gray-300 hover:border-blue-500 transition-colors duration-200 ${
                  selectedCategories.includes(category)
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center p-4 border-t border-gray-200">
          <div
            className="w-1/2 py-3 bg-white rounded border border-gray-300 mr-4
            text-gray-500 text-center 
            hover:border-blue-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer "
            onClick={handleResetFilters}
          >
            초기화
          </div>
          <div
            className="w-1/2 py-3 bg-blue-500 text-white text-center rounded 
            hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
            onClick={toggleFilter}
          >
            적용
          </div>
        </div>
      </div>
    </div>
  );
};
export default FilterOverlay;
