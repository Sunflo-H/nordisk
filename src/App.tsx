import { useEffect, useState } from "react";
import "./App.css";
import { readData } from "./firebase/firebaseDatabase";
import type { FilterOptionsType, ProductType } from "./types";
import Filter from "./components/Filter/Filter";
import ExcelManager from "./components/ExcelManager/ExcelManager";
import ProductCard from "./components/ProductCard/ProductCard";
import { set } from "firebase/database";

function App() {
  const [productsData, setProductsData] = useState<ProductType[]>([]);
  // 필터링된 상품 데이터를 저장하는 상태
  const [filteredProducts, setFilteredProducts] = useState<ProductType[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType>({
    year: [],
    gender: [],
    category: [],
  });
  // console.log("productsData", productsData);
  useEffect(() => {
    readData(setProductsData);
  }, []);

  /**
   * 남성만 클릭하면 남성 상품만 보여줘야지 = obj.성별 ==="남성"
   * 남성과 여성 클릭하면 둘다 보여줘야지 = obj.성별 === "남성" || obj.성별 === "여성"
   */
  useEffect(() => {
    // 필터링 로직
    const { year, gender, category } = filterOptions;
    const result = productsData.filter((product) => {
      const matchesYear =
        year.length === 0 || year.includes(product.연도.toString());
      const matchesGender =
        gender.length === 0 || gender.includes(product.성별);
      const matchesCategory =
        category.length === 0 || category.includes(product.카테고리);
      return matchesYear && matchesGender && matchesCategory;
    });
    setFilteredProducts(result);
  }, [filterOptions]);
  console.log("filteredProducts", filteredProducts);
  return (
    <div className="bg-gray-50 text-gray-800">
      <div className="max-w-[320px] m-auto ">
        <ExcelManager />

        <header className="text-2xl font-bold mb-4 p-1 ">
          노르디스크 재고 관리
        </header>
        <Filter setFilterOptions={setFilterOptions} />
        <main className="">
          {filteredProducts.map((product) => (
            <ProductCard product={product} key={product.상품코드} />
          ))}
        </main>
      </div>
    </div>
  );
}

export default App;
