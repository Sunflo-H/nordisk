import { useState } from "react";
import type { ProductSearchFilter } from "../../hooks/useProductSearchFilter";
import SearchFilterFields from "./SearchFilterFields";

type SearchFilterPanelProps = {
  search: ProductSearchFilter;
  // 바깥 여백 (페이지마다 위치가 달라 넘겨받는다)
  className?: string;
};

// 상품 목록 위쪽의 검색·필터 펼침 영역 (640~1023px 전용).
// 1024px 이상은 왼쪽 사이드바(SearchFilterSidebar), 모바일은 MobileFilter를 쓴다.
// 행사장 "상품 선택 열기"와 같은 폭·모양의 토글로 펼치고, 닫아도 검색어·칩은 그대로 걸려 있다.
const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  search,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`hidden sm:block lg:hidden max-w-[600px] m-auto px-4 ${className}`}
    >
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
          <SearchFilterFields search={search} />
        </section>
      )}
    </div>
  );
};

export default SearchFilterPanel;
