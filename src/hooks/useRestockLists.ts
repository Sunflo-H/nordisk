import { useCallback, useEffect, useRef, useState } from "react";
import {
  readRestockLists,
  type RestockLists,
} from "../firebase/firebaseDatabase";

type UseRestockListsResult = {
  // 챙길 목록·선판매 목록·올린 판매일자 (아직 못 읽었으면 null)
  lists: RestockLists | null;
  // 읽기 실패 시 오류 메시지
  errorMessage: string | null;
  // DB에서 다시 읽는다 (판매내역 저장 뒤 등)
  reload: () => Promise<void>;
  // 저장이 끝난 뒤 화면 값을 직접 바꾼다 (전체를 다시 읽지 않도록)
  setLists: React.Dispatch<React.SetStateAction<RestockLists | null>>;
};

// /restock의 챙길 목록·선판매 목록·올린 판매일자를 읽는 훅
function useRestockLists(): UseRestockListsResult {
  const [lists, setLists] = useState<RestockLists | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 화면을 떠난 뒤 늦게 온 결과로 상태를 바꾸지 않도록 막는다
  const isActiveRef = useRef(true);

  const reload = useCallback(async () => {
    try {
      const data = await readRestockLists();
      if (!isActiveRef.current) return;
      setLists(data);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      if (isActiveRef.current)
        setErrorMessage("챙길 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    isActiveRef.current = true;
    void reload();
    return () => {
      isActiveRef.current = false;
    };
  }, [reload]);

  return { lists, errorMessage, reload, setLists };
}

export default useRestockLists;
