import { useEffect, useState } from "react";
import { readProductUploadedAt } from "../firebase/firebaseDatabase";

type UseProductUploadedAtResult = {
  // 재고 엑셀을 올린 날짜 ("YYYY-MM-DD"). 아직 없으면 null.
  uploadedAt: string | null;
  // 한 번이라도 읽기를 마쳤는지 (실패해도 true)
  isLoaded: boolean;
  // 읽기 실패 여부
  hasError: boolean;
};

// 재고 엑셀을 올린 날짜(/meta/productUploadedAt)를 화면이 열릴 때 한 번 읽는 훅
function useProductUploadedAt(): UseProductUploadedAtResult {
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 화면을 떠난 뒤 도착한 결과로 상태를 바꾸지 않도록 막는다
    let isActive = true;
    readProductUploadedAt()
      .then((value) => {
        if (isActive) setUploadedAt(value);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isActive) setHasError(true);
      })
      .finally(() => {
        if (isActive) setIsLoaded(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  return { uploadedAt, isLoaded, hasError };
}

export default useProductUploadedAt;
