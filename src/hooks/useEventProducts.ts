import { useCallback, useEffect, useMemo, useState } from "react";
import { readEventProductCodes } from "../firebase/firebaseDatabase";
import type { ProductType } from "../types";
import useProducts from "./useProducts";

type UseEventProductsResult = {
  // 행사장 상품 (원본 /product에 있는 것만)
  eventProducts: ProductType[];
  // 행사장 상품코드 목록 (DB에 저장된 그대로)
  eventProductCodes: string[];
  // 전체 상품 데이터 (상품 선택 영역에서 사용)
  allProducts: ProductType[];
  // 행사장 목록을 한 번이라도 읽었는지 여부
  isLoaded: boolean;
  // 읽기 실패 시 오류 메시지
  errorMessage: string | null;
  // 저장·삭제 후 행사장 목록을 다시 읽는 함수
  reload: () => Promise<void>;
};

// 행사장 상품코드 목록과 전체 상품 데이터를 합쳐 행사장 상품을 돌려주는 훅
function useEventProducts(): UseEventProductsResult {
  const { products: allProducts } = useProducts();
  const [eventProductCodes, setEventProductCodes] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const codes = await readEventProductCodes();
      setEventProductCodes(codes);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("행사장 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // 화면이 열릴 때 행사장 목록을 한 번 읽는다 (비동기 결과로만 상태를 바꾼다)
    void reload();
  }, [reload]);

  // 원본 /product에 없는 상품코드는 빼고 합친다
  const eventProducts = useMemo(() => {
    const codeSet = new Set(eventProductCodes);
    return allProducts.filter((product) => codeSet.has(product.상품코드));
  }, [allProducts, eventProductCodes]);

  return {
    eventProducts,
    eventProductCodes,
    allProducts,
    isLoaded,
    errorMessage,
    reload,
  };
}

export default useEventProducts;
