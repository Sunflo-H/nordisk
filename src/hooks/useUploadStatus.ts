import { useCallback, useEffect, useRef, useState } from "react";
import {
  readLastSalesUploadedAt,
  readProductUploadedAt,
  readRestockIncoming,
} from "../firebase/firebaseDatabase";
import type { RestockIncoming } from "../types";

// 줄마다 보여 줄 "올린 날" 상태
// - "loading": 아직 읽는 중 / "error": 읽지 못함 / null: 올린 적 없음 / 문자열: "YYYY-MM-DD"
export type UploadedAtState = string | null | "loading" | "error";

type UseUploadStatusResult = {
  // 재고 엑셀을 올린 날 (/meta/productUploadedAt = 재고 기준일)
  stockUploadedAt: UploadedAtState;
  // 금일 입고를 올린 날 (/restock/incoming의 uploadedAt)
  incomingUploadedAt: UploadedAtState;
  // 판매내역을 마지막으로 올린 날 (/restock/salesDates의 uploadedAt 중 가장 늦은 날)
  salesUploadedAt: UploadedAtState;
  // 지금 저장된 금일 입고 (덮어쓰기 확인창에 쓴다. 없거나 못 읽었으면 null)
  incoming: RestockIncoming | null;
  // 올리기를 마친 뒤 다시 읽는다
  reload: () => Promise<void>;
};

// 홈 업로드 묶음이 쓰는 "올린 날"들을 읽는 훅 (읽기만, spec.md Phase 32)
// 셋은 서로 상관없으므로 하나를 못 읽어도 나머지는 보여 준다.
function useUploadStatus(): UseUploadStatusResult {
  const [stockUploadedAt, setStockUploadedAt] = useState<UploadedAtState>("loading");
  const [incomingUploadedAt, setIncomingUploadedAt] = useState<UploadedAtState>("loading");
  const [salesUploadedAt, setSalesUploadedAt] = useState<UploadedAtState>("loading");
  const [incoming, setIncoming] = useState<RestockIncoming | null>(null);
  // 화면을 떠난 뒤 늦게 온 결과로 상태를 바꾸지 않도록 막는다
  const isActiveRef = useRef(true);

  const reload = useCallback(async () => {
    const [stock, incomingResult, sales] = await Promise.allSettled([
      readProductUploadedAt(),
      readRestockIncoming(),
      readLastSalesUploadedAt(),
    ]);
    if (!isActiveRef.current) return;

    if (stock.status === "fulfilled") setStockUploadedAt(stock.value);
    else {
      console.error(stock.reason);
      setStockUploadedAt("error");
    }

    if (incomingResult.status === "fulfilled") {
      setIncoming(incomingResult.value);
      // 예전 기록에 uploadedAt이 없으면("") 올린 날을 모르므로 "없음"과 구분 없이 null로 둔다
      setIncomingUploadedAt(incomingResult.value?.uploadedAt || null);
    } else {
      // 못 읽어도 업로드는 할 수 있다 (덮어쓰기 안내만 빠진다)
      console.error(incomingResult.reason);
      setIncomingUploadedAt("error");
    }

    if (sales.status === "fulfilled") setSalesUploadedAt(sales.value);
    else {
      console.error(sales.reason);
      setSalesUploadedAt("error");
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;
    void reload();
    return () => {
      isActiveRef.current = false;
    };
  }, [reload]);

  return { stockUploadedAt, incomingUploadedAt, salesUploadedAt, incoming, reload };
}

export default useUploadStatus;
