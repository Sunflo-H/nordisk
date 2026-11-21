import { useState } from "react";
import type { ProductSearchFilter } from "../../hooks/useProductSearchFilter";
import {
  categoryOptions,
  genderOptions,
  yearOptions,
} from "../../utils/productFilter";
import FilterChipGroup from "../Filter/FilterChipGroup";

type SearchFilterPanelProps = {
  search: ProductSearchFilter;
  // 바깥 여백 (페이지마다 위치가 달라 넘겨받는다)
  className?: string;
};

// 상품 목록의 검색·필터 영역. 행사장 "상품 선택 열기"와 같은 폭·모양의 토글로 펼친다.
// 닫아도 검색어·칩은 그대로 걸려 있다 (목록 위 "필터 적용 중" 줄로 알린다).
const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  search,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className={`max-w-[600px] m-auto px-4 ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full mb-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
      >
        {isOpen ? "검색·필터 닫기 ▲" : "검색·필터 열기 ▼"}
      </button>
      {isOpen && (
        <section
          data-testid="search-filter"
          className="bg-white rounded-xl shadow-md p-4"
        >
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="상품코드 또는 상품명 검색"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-blue-500"
          />
          <div className="flex flex-col gap-2 mb-3">
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
          <div className="flex items-center justify-between text-sm text-gray-500">
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
        </section>
      )}
    </div>
  );
};

export default SearchFilterPanel;
