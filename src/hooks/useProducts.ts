import { useEffect, useState } from "react";
import { readData } from "../firebase/firebaseDatabase";
import type { ProductType } from "../types";

// Firebase `/product`의 전체 상품 데이터를 화면이 열릴 때 한 번 읽어 돌려주는 훅
function useProducts(): ProductType[] {
  const [productsData, setProductsData] = useState<ProductType[]>([]);

  useEffect(() => {
    readData(setProductsData);
  }, []);

  return productsData;
}

export default useProducts;
