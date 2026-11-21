import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import PageHeader from "../components/PageHeader/PageHeader";
import {
  readEventDeletionChecks,
  readEventDeletionLog,
  setEventDeletionCheck,
} from "../firebase/firebaseDatabase";
import useProducts from "../hooks/useProducts";
import type { EventDeletionChecks } from "../types";
import { listDeletedProductCodes } from "../utils/eventDeletionLog";

// 지운 행사장 상품 페이지 (/event/deleted). DB에는 "재고 확인" 체크만 쓴다.
// 행사 끝난 뒤 돌아온 재고를 PDA로 맞춰 보는 용도라 상품코드·상품명만 한 줄씩 보여 주고,
// 줄마다 "재고 확인" 체크를 둔다 (폰에서도 쓰는 예외, spec.md "삭제 기록").
const EventDeletedProducts = () => {
  const { products } = useProducts();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [checks, setChecks] = useState<EventDeletionChecks>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 저장 중인 상품코드 (저장 중에는 모든 체크 버튼을 막아 요청이 겹치지 않게 한다)
  const [savingCode, setSavingCode] = useState<string | null>(null);

  // 상품코드 → 상품명 (/product에 없으면 상품코드만 보인다)
  const productNames = useMemo(
    () => new Map(products.map((product) => [product.상품코드, product.상품명])),
    [products]
  );

  useEffect(() => {
    // 화면을 떠난 뒤 늦게 온 결과로 상태를 바꾸지 않도록 막는다
    let isActive = true;
    // 기록과 체크를 함께 읽어, 둘 다 읽은 뒤에 리스트를 보여 준다
    Promise.all([readEventDeletionLog(), readEventDeletionChecks()])
      .then(([entries, savedChecks]) => {
        if (!isActive) return;
        setChecks(savedChecks);
        setCodes(listDeletedProductCodes(entries));
      })
      .catch((error: unknown) => {
        console.error(error);
        if (isActive) setErrorMessage("삭제 기록을 읽지 못했습니다. 새로고침해 주세요.");
      });
    return () => {
      isActive = false;
    };
  }, []);

  // 체크를 켜거나 끈다. 저장이 끝난 뒤에만 화면을 바꾸고, 실패하면 그대로 둔다.
  const toggleCheck = async (code: string) => {
    const nextChecked = !checks[code];
    setSavingCode(code);
    try {
      const checkedAt = await setEventDeletionCheck(code, nextChecked);
      setChecks((prev) => {
        const next = { ...prev };
        if (checkedAt) next[code] = checkedAt;
        else delete next[code];
        return next;
      });
    } catch (error) {
      console.error(error);
      alert("재고 확인을 저장하지 못했습니다. 다시 시도해주세요.");
    }
    setSavingCode(null);
  };

  const checkedCount = codes?.filter((code) => checks[code]).length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="지운 행사장 상품" />
      <div className="max-w-[600px] m-auto mt-6 px-4 pb-10 text-sm">
        <Link to="/event" className="text-gray-500 underline hover:text-gray-700">
          ← 행사장 재고 관리
        </Link>
        <div
          data-testid="event-deletion-log"
          className="mt-3 p-4 bg-white border border-gray-200 rounded-lg"
        >
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          {!errorMessage && codes === null && (
            <p className="text-gray-500">불러오는 중...</p>
          )}
          {!errorMessage && codes?.length === 0 && (
            <p className="text-gray-500">
              지운 상품이 없습니다. ("빼기"·"전체 비우기"부터 기록됩니다)
            </p>
          )}
          {!errorMessage && codes && codes.length > 0 && (
            <>
              <p className="mb-2 font-semibold text-gray-700">
                {codes.length}개 · 재고 확인 {checkedCount}개
              </p>
              <ul className="space-y-1.5">
                {codes.map((code) => (
                  <li
                    key={code}
                    data-testid="deleted-product"
                    className="flex items-center gap-3 min-w-0"
                  >
                    <span className="font-mono shrink-0">{code}</span>
                    <span className="flex-1 min-w-0 truncate text-gray-500">
                      {productNames.get(code) ?? ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleCheck(code)}
                      disabled={savingCode !== null}
                      aria-pressed={Boolean(checks[code])}
                      title={checks[code] ? `확인: ${checks[code]}` : undefined}
                      className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors disabled:opacity-50 ${
                        checks[code]
                          ? "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {checks[code] ? "확인함 ✓" : "재고 확인"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDeletedProducts;
