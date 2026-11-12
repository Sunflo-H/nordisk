import { useEffect, useState } from "react";
import type { FilterOptionsType, ProductType } from "../../types";
import Filter from "../Filter/Filter";
import ProductCard from "../ProductCard/ProductCard";

type ProductListViewProps = {
  products: ProductType[];
};

// 상품 배열을 받아 필터 + 상품 카드 목록을 보여주는 공용 컴포넌트
// (/inventory, /event 페이지에서 함께 사용)
const ProductListView: React.FC<ProductListViewProps> = ({ products }) => {
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
              <ProductCard product={product} key={product.상품코드} />
            ))
          : products.map((product) => (
              <ProductCard product={product} key={product.상품코드} />
            ))}
      </main>
      <Filter setFilterOptions={setFilterOptions} />
    </>
  );
};

export default ProductListView;

// 데이터와 필터 옵션을 받아 필터링한 데이터를 반환하는 함수
function getFilteredData(
  productsData: ProductType[],
  filterOptions: FilterOptionsType
) {
  const { year, gender, category } = filterOptions;

  return productsData.filter((product) => {
    const matchesYear =
      year.length === 0 || year.includes(product.연도.toString());
    const matchesGender = gender.length === 0 || gender.includes(product.성별);
    const matchesCategory =
      category.length === 0 || category.includes(product.카테고리);
    return matchesYear && matchesGender && matchesCategory;
  });
}
