import { useEffect, useState } from "react";
import "./App.css";
import ProductCard from "./ProductCard";
import ExcelReader from "./ExcelReader";
import { readData } from "./firebase/firebaseDatabase";

type ProductRow = {
  상품코드: string;
  상품명: string;
  칼라: string;
  수량: number;
  재고: {
    "00": number;
    "01": number;
    "02": number;
    "03": number;
    "04": number;
    "05": number;
    "06": number;
    "07": number;
    "08": number;
    "09": number;
    "10": number;
    "11": number;
    "12": number;
    "13": number;
    "14": number;
    "15": number;
    "16": number;
    "17": number;
    "18": number;
    "19": number;
  };
};
const product1: ProductRow = {
  상품코드: "NDK-GRN-001",
  상품명: "Green Puffer Jacket",
  칼라: "E1",
  수량: 6,
  재고: {
    "00": 0,
    "01": 0,
    "02": 1,
    "03": 1,
    "04": 1,
    "05": 1,
    "06": 1,
    "07": 0,
    "08": 1,
    "09": 0,
    "10": 0,
    "11": 0,
    "12": 0,
    "13": 0,
    "14": 0,
    "15": 0,
    "16": 0,
    "17": 0,
    "18": 0,
    "19": 0,
  },
};
const product2: ProductRow = {
  상품코드: "NDK-GRN-002",
  상품명: "Red Puffer Jacket",
  칼라: "R1",
  수량: 6,
  재고: {
    "00": 0,
    "01": 0,
    "02": 1,
    "03": 1,
    "04": 1,
    "05": 1,
    "06": 1,
    "07": 0,
    "08": 1,
    "09": 0,
    "10": 0,
    "11": 0,
    "12": 0,
    "13": 0,
    "14": 0,
    "15": 0,
    "16": 0,
    "17": 0,
    "18": 0,
    "19": 0,
  },
};

function App() {
  const [productsData, setProductsData] = useState([]);
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
