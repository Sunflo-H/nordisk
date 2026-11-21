import { useState } from "react";
import { IoClose } from "react-icons/io5";
import type { ProductSearchFilter } from "../../hooks/useProductSearchFilter";
import {
  categoryOptions,
  countSelectedOptions,
  genderOptions,
  yearOptions,
} from "../../utils/productFilter";
import FilterBlackBox from "./FilterBlackBox";
import FilterOption from "./FilterOption";
import FilterToggleBtn from "./FilterToggleBtn";

type MobileFilterProps = {
  search: ProductSearchFilter;
};

// 모바일 전용 필터 (spec.md "PC·모바일 나누기"): 오른쪽 아래 필터 버튼 → 아래에서 올라오는 패널.
// 모양은 Phase 21 전과 같고, 동작은 PC와 같이 실시간이다 (칩을 누르는 즉시 걸리고 숫자도 바뀐다).
// 검색창은 없다. 닫아도 고른 칩은 그대로 걸려 있다.
const MobileFilter: React.FC<MobileFilterProps> = ({ search }) => {
  const [isActive, setIsActive] = useState(false);
  const { filterOptions, toggleFilterOption, clearFilter, optionCounts } =
    search;
  const close = () => setIsActive(false);

  return (
    <div className="sm:hidden">
      <FilterToggleBtn
        isActive={isActive}
        openFilter={() => setIsActive(true)}
        selectedCount={countSelectedOptions(filterOptions)}
      />
      <FilterBlackBox isActive={isActive} onClose={close} />
      <div
        data-testid="mobile-filter-panel"
        aria-hidden={!isActive}
        className={`
          fixed bottom-0 left-0 right-0
          w-screen max-w-screen min-w-0 max-h-screen
          aw:max-w-[420px] aw:min-w-[320px]
          m-auto
          bg-white
          rounded-t-2xl
          shadow-lg
          z-20
          transition-transform duration-300 ease-in-out
          overflow-scroll
          ${isActive ? "translate-y-0" : "translate-y-full"}
        `}
      >
        <div className="flex items-center justify-between pt-6 pb-4 px-4 border-b border-gray-200">
          <div className="font-bold text-2xl">상품 필터</div>
          <button
            type="button"
            aria-label="필터 닫기"
            className="cursor-pointer"
            onClick={close}
          >
            <IoClose className="font-bold text-4xl" />
          </button>
        </div>

        <FilterOption
          title="연도"
          options={yearOptions}
          selectedOptions={filterOptions.year}
          onToggle={(option) => toggleFilterOption("year", option)}
          counts={optionCounts.year}
        />
        <FilterOption
          title="성별"
          options={genderOptions}
          selectedOptions={filterOptions.gender}
          onToggle={(option) => toggleFilterOption("gender", option)}
          counts={optionCounts.gender}
        />
        <FilterOption
          title="카테고리"
          options={categoryOptions}
          selectedOptions={filterOptions.category}
          onToggle={(option) => toggleFilterOption("category", option)}
          counts={optionCounts.category}
        />

        <div className="flex justify-center items-center p-4">
          <button
            type="button"
            className="w-1/2 py-3 mr-4 bg-white text-gray-500 text-center rounded border border-gray-300 transition-colors duration-200 cursor-pointer hover:border-blue-600 hover:text-blue-500"
            onClick={clearFilter}
          >
            초기화
          </button>
          {/* 칩은 누르는 즉시 걸리므로 "적용" 대신 "닫기" */}
          <button
            type="button"
            className="w-1/2 py-3 bg-blue-500 text-white text-center rounded transition-colors duration-200 cursor-pointer hover:bg-blue-600"
            onClick={close}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilter;
