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
    <div className="max-w-[430px] mx-auto">
      <ExcelManager />
      <Filter />
      <div className="grid grid-cols-3 gap-3 p-4">
        {productsData.map((product) => (
          <ProductCard product={product} key={product.상품코드} />
        ))}
      </div>
    </div>
  );
}

export default App;
