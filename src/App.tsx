import { useEffect, useState } from "react";
import "./App.css";
import ProductCard from "./ProductCard";
import ExcelReader from "./ExcelReader";
import { readData } from "./firebase/firebaseDatabase";

type ProductType = {
  상품코드: string;
  상품명: string;
  칼라: string;
  수량: number;
  재고: {
    [key: string]: number;
  };
};

function App() {
  const [productsData, setProductsData] = useState<ProductType[]>([]);
  useEffect(() => {
    readData((data: ProductType[]) => {
      setProductsData(data);
    });
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
