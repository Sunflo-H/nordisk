import type { ReactNode } from "react";
import type { ProductSearchFilter } from "../../hooks/useProductSearchFilter";
import type { EventCategoryMap, ProductType } from "../../types";
import MobileFilter from "../Filter/MobileFilter";
import ProductCard from "../ProductCard/ProductCard";
import { getStockLocation } from "../../utils/stockLocation";

type ProductListViewProps = {
  // 페이지의 검색·필터 상태 (검색·필터 영역은 페이지 위쪽에 따로 둔다)
  search: ProductSearchFilter;
  // 상품 카드마다 붙일 추가 버튼 등 (선택). /inventory에서는 넘기지 않는다.
  renderCardAction?: (product: ProductType) => ReactNode;
  // 행사장 분류 (선택). 넘기면 카드마다 "행사장만 / 매장만 / 둘 다" 배지를 붙인다.
  eventCategories?: EventCategoryMap;
};

// 검색·필터를 건 상품 카드 목록 (/inventory, /event 공용)
// 걸려 있으면 목록 위에 "필터 적용 중" 줄을 보여 준다.
const ProductListView: React.FC<ProductListViewProps> = ({
  search,
  renderCardAction,
  eventCategories,
}) => {
  const { filteredProducts, isFiltering, clearFilter } = search;

  return (
    <>
      {isFiltering && (
        // 필터 적용 상태 줄: 검색·필터 영역을 닫아도 지금 목록이 걸러진 것인지 알려 준다.
        <div
          data-testid="filter-status"
          className="flex items-center justify-between mb-2 px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span className="text-blue-700">
            필터 적용 중 · {filteredProducts.length}개
          </span>
          <button
            type="button"
            onClick={clearFilter}
            className="px-2 py-0.5 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            해제
          </button>
        </div>
      )}
      <main className="">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard
              product={product}
              key={product.상품코드}
              action={renderCardAction?.(product)}
              stockLocation={
                eventCategories &&
                getStockLocation(eventCategories, product.상품코드)
              }
            />
          ))
        ) : (
          isFiltering && (
            // 결과 0개: 전체 목록으로 되돌리지 않고 안내만 보여 준다.
            <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
              <p>조건에 맞는 상품이 없습니다</p>
              <button
                type="button"
                onClick={clearFilter}
                className="px-4 py-2 text-sm text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                필터 해제
              </button>
            </div>
          )
        )}
      </main>
      {/* 모바일 전용 필터 버튼·패널 (PC는 페이지 위쪽 검색·필터) */}
      <MobileFilter search={search} />
    </>
  );
};

export default ProductListView;
