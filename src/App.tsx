import { useEffect, useState } from "react";
import "./App.css";
import "./Filter.css";
import ProductCard from "./ProductCard";
import ExcelManager from "./ExcelManager";
import { readData } from "./firebase/firebaseDatabase";
import type { ProductType } from "./types";
import Filter from "./Filter";

function App() {
  const [productsData, setProductsData] = useState<ProductType[]>([]);
  useEffect(() => {
    readData(setProductsData);
  }, []);
  return (
    <div className="bg-gray-50 ">
      <div className="max-w-[320px] m-auto ">
        <ExcelManager />

        <header className="text-2xl font-bold mb-4 p-1">
          노르디스크 재고 관리
        </header>
        <Filter />
        <main className="">
          {productsData.map((product) => (
            <ProductCard product={product} key={product.상품코드} />
          ))}
        </main>
      </div>
    </div>
  );
}

export default App;
