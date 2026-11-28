import { useCallback, useEffect, useRef, useState } from "react";
import {
  readAllProducts,
  readEventCategories,
  readProductUploadedAt,
  readRestockIncoming,
} from "../firebase/firebaseDatabase";
import type { EventCategoryMap, ProductType, RestockIncoming } from "../types";

export type IncomingPageData = {
  // 마지막으로 올린 금일 입고 (없으면 null)
  incoming: RestockIncoming | null;
  products: ProductType[];
  eventCategories: EventCategoryMap;
  // 지금 재고 날짜 (/meta/productUploadedAt)
  stockDate: string | null;
};

type UseIncomingPageDataResult = {
  // 아직 못 읽었으면 null
  data: IncomingPageData | null;
  errorMessage: string | null;
  // 금일 입고를 저장한 뒤 다시 읽는다
  reload: () => Promise<void>;
};

// 입고 상품 확인 페이지(/incoming)에 필요한 값을 한 번에 읽는 훅 (읽기만)
function useIncomingPageData(): UseIncomingPageDataResult {
  const [data, setData] = useState<IncomingPageData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 화면을 떠난 뒤 늦게 온 결과로 상태를 바꾸지 않도록 막는다
  const isActiveRef = useRef(true);

  const reload = useCallback(async () => {
    try {
      const [incoming, products, eventCategories, stockDate] = await Promise.all([
        readRestockIncoming(),
        readAllProducts(),
        readEventCategories(),
        readProductUploadedAt(),
      ]);
      if (!isActiveRef.current) return;
      setData({ incoming, products, eventCategories, stockDate });
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      if (isActiveRef.current)
        setErrorMessage("입고 상품을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;
    void reload();
    return () => {
      isActiveRef.current = false;
    };
  }, [reload]);

  return { data, errorMessage, reload };
}

export default useIncomingPageData;
