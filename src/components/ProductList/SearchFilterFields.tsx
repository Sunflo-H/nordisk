import type { ProductSearchFilter } from "../../hooks/useProductSearchFilter";
import {
  categoryOptions,
  genderOptions,
  yearOptions,
} from "../../utils/productFilter";
import FilterChipGroup from "../Filter/FilterChipGroup";

type SearchFilterFieldsProps = {
  search: ProductSearchFilter;
  // 좁은 사이드바용: 검색창·글자를 작게
  compact?: boolean;
};

// 검색창 + 칩 세 줄 + "N개 표시"·"필터 초기화" (PC 위쪽 펼침 영역과 왼쪽 사이드바가 함께 쓴다)
const SearchFilterFields: React.FC<SearchFilterFieldsProps> = ({
  search,
  compact = false,
}) => {
  const {
    keyword,
    setKeyword,
    filterOptions,
    toggleFilterOption,
    clearFilter,
    filteredProducts,
    optionCounts,
    isFiltering,
  } = search;

  return (
    <>
      <input
        type="search"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="상품코드 또는 상품명 검색"
        className={`w-full border border-gray-300 rounded-lg mb-3 focus:outline-none focus:border-blue-500 ${
          compact ? "px-2 py-1.5 text-sm" : "px-3 py-2"
        }`}
      />
      <div className="flex flex-col gap-3 mb-3">
        <FilterChipGroup
          title="연도"
          options={yearOptions}
          selectedOptions={filterOptions.year}
          onToggle={(option) => toggleFilterOption("year", option)}
          counts={optionCounts.year}
        />
        <FilterChipGroup
          title="성별"
          options={genderOptions}
          selectedOptions={filterOptions.gender}
          onToggle={(option) => toggleFilterOption("gender", option)}
          counts={optionCounts.gender}
        />
        <FilterChipGroup
          title="카테고리"
          options={categoryOptions}
          selectedOptions={filterOptions.category}
          onToggle={(option) => toggleFilterOption("category", option)}
          counts={optionCounts.category}
        />
      </div>
      <div
        className={`flex items-center justify-between text-gray-500 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <span>{filteredProducts.length}개 표시</span>
        <button
          type="button"
          onClick={clearFilter}
          disabled={!isFiltering}
          className="text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
        >
          필터 초기화
        </button>
      </div>
    </>
  );
};

export default SearchFilterFields;
