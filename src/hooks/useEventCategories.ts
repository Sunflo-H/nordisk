import { useCallback, useEffect, useState } from "react";
import { readEventCategories } from "../firebase/firebaseDatabase";
import type { EventCategoryMap } from "../types";

type UseEventCategoriesResult = {
  // 행사장 상품코드 → 분류 (DB /event/products)
  eventCategories: EventCategoryMap;
  // 행사장 목록을 한 번이라도 읽었는지 여부 (성공·실패 모두 true)
  isLoaded: boolean;
  // 읽기 실패 시 오류 메시지
  errorMessage: string | null;
  // 저장·삭제 후 행사장 목록을 다시 읽는 함수
  reload: () => Promise<void>;
};

// 행사장 상품코드와 분류를 화면이 열릴 때 읽어 돌려주는 훅
function useEventCategories(): UseEventCategoriesResult {
  const [eventCategories, setEventCategories] = useState<EventCategoryMap>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const categories = await readEventCategories();
      setEventCategories(categories);
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

  return { eventCategories, isLoaded, errorMessage, reload };
}

export default useEventCategories;
