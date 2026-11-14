import { useEffect, useState } from "react";
import { readAllProducts } from "../firebase/firebaseDatabase";
import type { ProductType } from "../types";

type UseProductsResult = {
  // 전체 상품 데이터 (/product)
  products: ProductType[];
  // /product를 한 번이라도 읽었는지 여부 (성공·실패 모두 true)
  isLoaded: boolean;
  // 읽기 실패 시 오류 메시지
  errorMessage: string | null;
};

// Firebase `/product`의 전체 상품 데이터를 화면이 열릴 때 한 번 읽어 돌려주는 훅
function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 화면을 떠난 뒤 늦게 온 결과로 상태를 바꾸지 않도록 막는다
    let isActive = true;
    readAllProducts()
      .then((data) => {
        if (isActive) setProducts(data);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isActive) setErrorMessage("상품 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (isActive) setIsLoaded(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  return { products, isLoaded, errorMessage };
}

export default useProducts;
