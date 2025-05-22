import { useEffect, useState } from "react";
import "./App.css";
import ProductCard from "./ProductCard";
import ExcelReader from "./ExcelReader";
import { readData } from "./firebase/firebaseDatabase";
import type { ProductType } from "./types";

function App() {
  const [productsData, setProductsData] = useState<ProductType[]>([]);
  console.log(productsData);
  useEffect(() => {
    readData(setProductsData);
  }, []);
  return (
    <>
      <ExcelReader />
      <div className="grid grid-cols-2 gap-3 p-4">
        {productsData.map((product) => (
          <ProductCard product={product} key={product.상품코드} />
        ))}
      </div>
    </>
  );
}

export default App;
