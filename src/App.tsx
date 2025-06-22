import { useEffect, useState } from "react";
import "./App.css";
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
    <>
      <ExcelManager />
      <Filter />
      <div className="grid grid-cols-3 gap-3 p-4">
        {productsData.map((product) => (
          <ProductCard product={product} key={product.상품코드} />
        ))}
      </div>
    </>
  );
}

export default App;
