import { useEffect, useState } from "react";
import "./App.css";
import { readData } from "./firebase/firebaseDatabase";
import type { FilterOptionsType, ProductType } from "./types";
import Filter from "./components/Filter/Filter";
import ExcelManager from "./components/ExcelManager/ExcelManager";
import ProductCard from "./components/ProductCard/ProductCard";

function App() {
  const [productsData, setProductsData] = useState<ProductType[]>([]);
  // 필터링된 상품 데이터를 저장하는 상태
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType>({
    year: [],
    gender: [],
    category: [],
  });

  useEffect(() => {
    readData(setProductsData);
  }, []);

  useEffect(() => {
    const filteredData = getFilteredData(productsData, filterOptions);
    setFilteredProducts(filteredData);
  }, [filterOptions]);
  console.log("filteredProducts", filteredProducts);

  return (
    <div className="bg-gray-50 text-gray-800 h-100vh">
      <div className="max-w-[320px] m-auto ">
        <ExcelManager />
        <header className="text-2xl font-bold mb-4 p-1 ">
          노르디스크 재고 관리
        </header>
        <main className="">
          {filteredProducts.length > 0
            ? filteredProducts.map((product) => (
                <ProductCard product={product} key={product.상품코드} />
              ))
            : productsData.map((product) => (
                <ProductCard product={product} key={product.상품코드} />
              ))}
        </main>
        <Filter setFilterOptions={setFilterOptions} />
      </div>
    </div>
  );
}

export default App;

// 데이터와 필터 옵션을 받아 필터링한 데이터를 반환하는 함수
function getFilteredData(
  productsData: ProductType[],
  filterOptions: FilterOptionsType
) {
  const { year, gender, category } = filterOptions;

  const filterdData = productsData.filter((product) => {
    const matchesYear =
      year.length === 0 || year.includes(product.연도.toString());
    const matchesGender = gender.length === 0 || gender.includes(product.성별);
    const matchesCategory =
      category.length === 0 || category.includes(product.카테고리);
    return matchesYear && matchesGender && matchesCategory;
  });
  return filterdData;
}
