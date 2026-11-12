import { useEffect, useState, type ReactNode } from "react";
import type { FilterOptionsType, ProductType } from "../../types";
import Filter from "../Filter/Filter";
import ProductCard from "../ProductCard/ProductCard";
import { getFilteredData } from "../../utils/productFilter";

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
  // 필터링된 상품 데이터를 저장하는 상태
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType>({
    year: [],
    gender: [],
    category: [],
  });

  useEffect(() => {
    const filteredData = getFilteredData(products, filterOptions);

    if (filteredData.length === 0 && products.length > 0)
      alert("해당하는 필터 옵션의 상품이 없습니다. 다시 선택해주세요.");

    setFilteredProducts(filteredData);
  }, [filterOptions, products]);

  return (
    <>
      <main className="">
        {filteredProducts.length > 0
          ? filteredProducts.map((product) => (
              <ProductCard
                product={product}
                key={product.상품코드}
                action={renderCardAction?.(product)}
              />
            ))
          : products.map((product) => (
              <ProductCard
                product={product}
                key={product.상품코드}
                action={renderCardAction?.(product)}
              />
            ))}
      </main>
      <Filter setFilterOptions={setFilterOptions} />
    </>
  );
};

export default ProductListView;
