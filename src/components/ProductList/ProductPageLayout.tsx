import type { ReactNode } from "react";
import type { ProductSearchFilter } from "../../hooks/useProductSearchFilter";
import SearchFilterFields from "./SearchFilterFields";

type ProductPageLayoutProps = {
  search: ProductSearchFilter;
  // 가운데 열 (상품 선택 영역·목록 등). 각자 600px 폭·여백을 그대로 가진다.
  children: ReactNode;
};

// 상품 목록 페이지 틀 (/inventory, /event).
// 목록(가운데 열)은 화면 가운데 그대로 두고, 1024px 이상에서는 그 왼쪽 빈 공간에 검색·필터 사이드바를 띄운다.
// 사이드바는 스크롤해도 화면 위에 붙어 있어, 고르는 대로 목록이 바뀌는 것을 함께 볼 수 있다 (spec.md "PC 사이드바").
// 사이드바 폭은 왼쪽 빈 공간에 맞춰 최대 256px까지 (목록 600px의 절반 300px + 간격 16px를 뺀 나머지).
const ProductPageLayout: React.FC<ProductPageLayoutProps> = ({
  search,
  children,
}) => (
  <div className="relative">
    {/* 가운데 열의 위쪽 여백(mt-6)이 이 틀 밖으로 겹쳐 나가므로(margin collapse) 사이드바는 여백 없이 top-0에서 시작해야 첫 요소와 나란하다 */}
    <div className="hidden lg:block absolute top-0 bottom-0 right-[calc(50%+316px)] w-[min(16rem,calc(50%-332px))]">
      <aside
        data-testid="search-filter-sidebar"
        className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto bg-white rounded-xl shadow-md p-3"
      >
        <h2 className="text-sm font-bold mb-2">검색·필터</h2>
        <SearchFilterFields search={search} compact />
      </aside>
    </div>
    {children}
  </div>
);

export default ProductPageLayout;
