import { useMemo } from "react";
import type { EventCategoryMap, ProductType } from "../types";
import { isEventProduct } from "../utils/stockLocation";
import useEventCategories from "./useEventCategories";
import useProducts from "./useProducts";

type UseEventProductsResult = {
  // 행사장 상품 (원본 /product에 있는 것만)
  eventProducts: ProductType[];
  // 행사장 상품코드 목록 (DB에 저장된 그대로)
  eventProductCodes: string[];
  // 행사장 상품코드 → 분류
  eventCategories: EventCategoryMap;
  // 전체 상품 데이터 (상품 선택 영역에서 사용)
  allProducts: ProductType[];
  // 행사장 목록을 한 번이라도 읽었는지 여부
  isLoaded: boolean;
  // 읽기 실패 시 오류 메시지
  errorMessage: string | null;
  // 저장·삭제 후 행사장 목록을 다시 읽는 함수
  reload: () => Promise<void>;
};

// 행사장 상품코드·분류와 전체 상품 데이터를 합쳐 행사장 상품을 돌려주는 훅
function useEventProducts(): UseEventProductsResult {
  const { products: allProducts } = useProducts();
  const { eventCategories, isLoaded, errorMessage, reload } =
    useEventCategories();

  const eventProductCodes = useMemo(
    () => Object.keys(eventCategories),
    [eventCategories],
  );

  // 원본 /product에 없는 상품코드는 빼고 합친다
  const eventProducts = useMemo(
    () =>
      allProducts.filter((product) =>
        isEventProduct(eventCategories, product.상품코드),
      ),
    [allProducts, eventCategories],
  );

  return {
    eventProducts,
    eventProductCodes,
    eventCategories,
    allProducts,
    isLoaded,
    errorMessage,
    reload,
  };
}

export default useEventProducts;
