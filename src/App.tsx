import { useEffect, useState } from "react";
import "./App.css";
import ProductCard from "./ProductCard";
import ExcelReader from "./ExcelReader";
import { readData } from "./firebase/firebaseDatabase";

export type SizeKey =
  | "00"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19";

export type 재고Type = {
  [key in SizeKey]: number;
};

type ProductType = {
  상품코드: string;
  상품명: string;
  칼라: string;
  수량: number;
  재고: 재고Type;
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
