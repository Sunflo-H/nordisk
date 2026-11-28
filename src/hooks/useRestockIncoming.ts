import { useCallback, useEffect, useRef, useState } from "react";
import { readRestockIncoming } from "../firebase/firebaseDatabase";
import type { RestockIncoming } from "../types";

type UseRestockIncomingResult = {
  // 지금 저장된 금일 입고 (없거나 아직 못 읽었으면 null)
  incoming: RestockIncoming | null;
  // 금일 입고를 저장한 뒤 다시 읽는다
  reload: () => Promise<void>;
};

// 저장된 금일 입고(/restock/incoming)를 읽는 훅 (읽기만).
// 홈의 금일 입고 업로드가 덮어쓰기 확인창에 쓴다.
function useRestockIncoming(): UseRestockIncomingResult {
  const [incoming, setIncoming] = useState<RestockIncoming | null>(null);
  // 화면을 떠난 뒤 늦게 온 결과로 상태를 바꾸지 않도록 막는다
  const isActiveRef = useRef(true);

  const reload = useCallback(async () => {
    try {
      const value = await readRestockIncoming();
      if (isActiveRef.current) setIncoming(value);
    } catch (error) {
      // 못 읽어도 업로드는 할 수 있다 (덮어쓰기 안내만 빠진다)
      console.error(error);
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;
    void reload();
    return () => {
      isActiveRef.current = false;
    };
  }, [reload]);

  return { incoming, reload };
}

export default useRestockIncoming;
