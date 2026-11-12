import { useMemo, useState, type ReactNode } from "react";
import type { FilterOptionsType, ProductType } from "../../types";
import Filter from "../Filter/Filter";
import ProductCard from "../ProductCard/ProductCard";
import {
  countProductsByOption,
  countSelectedOptions,
  emptyFilterOptions,
  getFilteredData,
} from "../../utils/productFilter";

type ProductListViewProps = {
  products: ProductType[];
  // 상품 카드마다 붙일 추가 버튼 등 (선택). /inventory에서는 넘기지 않는다.
  renderCardAction?: (product: ProductType) => ReactNode;
};

// 상품 배열을 받아 필터 + 상품 카드 목록을 보여주는 공용 컴포넌트
// (/inventory, /event 페이지에서 함께 사용)
const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  renderCardAction,
}) => {
  // 실제로 적용된 필터 값 (패널에서 "적용"을 눌렀을 때만 바뀐다)
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsType>(emptyFilterOptions);

  const filteredProducts = useMemo(
    () => getFilteredData(products, filterOptions),
    [products, filterOptions]
  );

  // 칩 옆에 보여 줄 값별 상품 수 (이 페이지 상품 기준, 고정 개수)
  const optionCounts = useMemo(
    () => ({
      year: countProductsByOption(products, "year"),
      gender: countProductsByOption(products, "gender"),
      category: countProductsByOption(products, "category"),
    }),
    [products]
  );

  const selectedCount = countSelectedOptions(filterOptions);
  const isFiltering = selectedCount > 0;

  const clearFilter = () => setFilterOptions(emptyFilterOptions);

  return (
    <>
      {isFiltering && (
        // 필터 적용 상태 줄: 지금 목록이 걸러진 것인지 알려 준다.
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
      <Filter
        appliedOptions={filterOptions}
        onApply={setFilterOptions}
        optionCounts={optionCounts}
      />
    </>
  );
};

export default ProductListView;
