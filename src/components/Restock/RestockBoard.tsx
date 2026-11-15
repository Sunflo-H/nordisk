import { useMemo, useState } from "react";
import {
  changeRestockItemStatus,
  deleteRestockItem,
  setRestockReturnChecked,
  type RestockLists,
  type RestockStatusChange,
} from "../../firebase/firebaseDatabase";
import useProducts from "../../hooks/useProducts";
import type { ProductType, RestockItem, RestockReturn } from "../../types";
import {
  groupByStatus,
  restockReasonLabels,
  restockStatusGroups,
  sortRestockEntries,
} from "../../utils/restockView";
import RestockItemTable from "./RestockItemTable";
import ReturnCheckList from "./ReturnCheckList";
import SalesDateList from "./SalesDateList";

type RestockBoardProps = {
  lists: RestockLists;
  // 저장이 끝난 뒤 화면 값을 바꾼다
  setLists: React.Dispatch<React.SetStateAction<RestockLists | null>>;
};

type ItemLine = Pick<RestockItem, "상품코드" | "칼라" | "사이즈" | "사이즈명">;

// 챙길 목록 화면 (PC 전용 페이지 안에서만 쓰인다)
// 상태 바꾸기·확인함·지우기는 DB 저장이 끝난 뒤에만 화면을 바꾸고, 실패하면 그대로 둔다.
const RestockBoard = ({ lists, setLists }: RestockBoardProps) => {
  // 지금 재고·상품명 표시용 (못 읽어도 목록은 보여 준다)
  const { products, errorMessage: productsError } = useProducts();
  const productMap = useMemo(() => {
    const map = new Map<string, ProductType>();
    for (const product of products) map.set(product.상품코드, product);
    return map;
  }, [products]);

  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  // 마지막 저장 결과 (실패는 알림창으로 알린다)
  const [message, setMessage] = useState<string | null>(null);

  const itemGroups = useMemo(
    () => groupByStatus(sortRestockEntries(lists.items)),
    [lists.items]
  );
  const returnEntries = useMemo(() => sortRestockEntries(lists.returns), [lists.returns]);

  const getCurrentStock = (item: ItemLine): number | null => {
    const product = productMap.get(item.상품코드);
    if (!product) return null;
    return product.재고?.[item.칼라]?.[item.사이즈] ?? 0;
  };
  const getProductName = (item: RestockItem | RestockReturn): string =>
    item.상품명 || productMap.get(item.상품코드)?.상품명 || "-";

  // 같은 항목을 저장하는 동안 버튼을 막는다
  const runSaving = async (id: string, task: () => Promise<void>) => {
    if (savingIds.has(id)) return;
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      await task();
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleChangeStatus = (id: string, change: RestockStatusChange) =>
    runSaving(id, async () => {
      const item = lists.items[id];
      let saved: RestockItem;
      try {
        saved = await changeRestockItemStatus(id, change);
      } catch (error) {
        console.error(error);
        alert(
          `저장하지 못했습니다. 화면은 그대로입니다.\n${error instanceof Error ? error.message : ""}`
        );
        return;
      }
      setLists((prev) =>
        prev ? { ...prev, items: { ...prev.items, [id]: saved } } : prev
      );
      setMessage(`${describe(item)} → ${describeStatus(saved)} 저장했습니다.`);
    });

  const handleDelete = (id: string) => {
    const item = lists.items[id];
    if (
      !window.confirm(
        `챙길 목록에서 지울까요? 되돌릴 수 없습니다.\n${item.판매일자} ${describe(item)} 수량 ${item.수량}`
      )
    )
      return;
    void runSaving(id, async () => {
      try {
        await deleteRestockItem(id);
      } catch (error) {
        console.error(error);
        alert("지우지 못했습니다. 화면은 그대로입니다.");
        return;
      }
      setLists((prev) => {
        if (!prev) return prev;
        const items = { ...prev.items };
        delete items[id];
        return { ...prev, items };
      });
      setMessage(`${describe(item)} 항목을 챙길 목록에서 지웠습니다.`);
    });
  };

  const handleToggleReturn = (id: string, checked: boolean) =>
    runSaving(id, async () => {
      try {
        await setRestockReturnChecked(id, checked);
      } catch (error) {
        console.error(error);
        alert("저장하지 못했습니다. 화면은 그대로입니다.");
        return;
      }
      setLists((prev) =>
        prev
          ? {
              ...prev,
              returns: { ...prev.returns, [id]: { ...prev.returns[id], 확인함: checked } },
            }
          : prev
      );
      setMessage(
        `반품 ${describe(lists.returns[id])} → ${checked ? "확인함" : "확인 안 함"} 저장했습니다.`
      );
    });

  return (
    <div className="mt-8 pb-16">
      <h2 className="text-xl font-bold">챙길 목록</h2>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-6 text-sm text-emerald-700"
      >
        {message}
      </p>
      {productsError && (
        <p className="text-sm text-red-500">
          재고를 불러오지 못해 "지금 재고"가 보이지 않습니다. 저장은 DB에서 재고를 다시 읽어 처리합니다.
        </p>
      )}

      <SalesDateList salesDates={lists.salesDates} />

      <ReturnCheckList
        entries={returnEntries}
        getProductName={getProductName}
        savingIds={savingIds}
        onToggle={handleToggleReturn}
      />

      {restockStatusGroups.map(({ status, label }) => (
        <RestockItemTable
          key={status}
          status={status}
          label={label}
          entries={itemGroups[status]}
          getCurrentStock={getCurrentStock}
          getProductName={getProductName}
          savingIds={savingIds}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

export default RestockBoard;

// 알림 문구용 항목 설명: "상품코드 칼라/사이즈"
function describe(item: ItemLine): string {
  return `${item.상품코드} ${item.칼라}/${item.사이즈명 || item.사이즈}`;
}

function describeStatus(item: RestockItem): string {
  if (item.상태 === "packed") return "챙김";
  if (item.상태 === "notPacked")
    return `못 챙김(${item.사유 ? restockReasonLabels[item.사유] : "사유 없음"}, 기준재고 ${item.기준재고})`;
  return "챙길 것";
}
