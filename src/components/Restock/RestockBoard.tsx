import { useMemo, useState } from "react";
import {
  changeRestockItemStatus,
  deleteRestockItem,
  setRestockReturnChecked,
  StaleRestockItemError,
  type RestockLists,
  type RestockStatusChange,
} from "../../firebase/firebaseDatabase";
import useProducts from "../../hooks/useProducts";
import useProductUploadedAt from "../../hooks/useProductUploadedAt";
import type { ProductType, RestockItem, RestockReturn } from "../../types";
import { computeArrival, type ArrivalResult } from "../../utils/restockArrival";
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

// 챙길 목록 화면 (PC는 표, 폰·워치는 카드로 보여 준다. 모든 기능을 모든 기기에서 쓴다)
// 상태 바꾸기·확인함·지우기는 DB 저장이 끝난 뒤에만 화면을 바꾸고, 실패하면 그대로 둔다.
const RestockBoard = ({ lists, setLists }: RestockBoardProps) => {
  // 지금 재고·상품명 표시용 (못 읽어도 목록은 보여 준다)
  const { products, isLoaded: productsLoaded, errorMessage: productsError } = useProducts();
  // 지금 재고 날짜 (입고 알림 계산용)
  const {
    uploadedAt: stockDate,
    isLoaded: stockDateLoaded,
    hasError: stockDateError,
  } = useProductUploadedAt();
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

  // 입고 알림: 못 챙김 항목마다 입고 수를 다시 계산한다 (DB에는 쓰지 않는다).
  // 재고나 재고 날짜를 못 읽었으면 계산하지 않는다 (재고 0으로 잘못 계산하지 않도록).
  const canComputeArrival =
    productsLoaded && !productsError && stockDateLoaded && !stockDateError && !!stockDate;
  const arrivals = useMemo(() => {
    const map = new Map<string, ArrivalResult>();
    if (!canComputeArrival || !stockDate) return map;
    for (const { id, value: item } of itemGroups.notPacked) {
      const arrival = computeArrival({
        item,
        // 재고 엑셀에 그 상품·칼라·사이즈가 없으면 0 (기준재고를 적을 때와 같은 규칙)
        currentStock: productMap.get(item.상품코드)?.재고?.[item.칼라]?.[item.사이즈] ?? 0,
        stockDate,
        sales: lists.sales,
        salesDates: lists.salesDates,
      });
      if (arrival) map.set(id, arrival);
    }
    return map;
  }, [canComputeArrival, stockDate, itemGroups.notPacked, productMap, lists.sales, lists.salesDates]);

  // 입고 수가 1개 이상인 못 챙김 항목은 맨 위 알림으로 끌어올리고, 못 챙김 묶음에서는 뺀다
  const arrivedEntries = itemGroups.notPacked.filter(
    ({ id }) => (arrivals.get(id)?.입고수 ?? 0) >= 1
  );
  const arrivedIds = new Set(arrivedEntries.map(({ id }) => id));
  const arrivedMap = new Map(
    arrivedEntries.flatMap(({ id }) => {
      const arrival = arrivals.get(id);
      return arrival ? [[id, arrival] as const] : [];
    })
  );
  // 못 챙김 항목의 계산 구간 중 판매내역을 올리지 않은 날 (입고를 놓칠 수 있다)
  const arrivalMissingDates = [
    ...new Set([...arrivals.values()].flatMap((arrival) => arrival.빠진날)),
  ].sort();

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

  const handleChangeStatus = (id: string, change: RestockStatusChange) => {
    const item = lists.items[id];
    // 못 챙김 → 챙길 것으로 되돌리면 기준재고가 지워져 그 사이 입고를 놓칠 수 있다. 취소하면 DB에 쓰지 않는다.
    if (
      change.상태 === "pending" &&
      item.상태 === "notPacked" &&
      !window.confirm(
        `챙길 것으로 되돌릴까요?\n${describe(item)}\n\n적어 둔 기준재고(${item.기준재고 ?? "-"}, ${item.기준일 ?? "-"})가 지워집니다. 다시 못 챙김을 누르면 그때 재고로 새로 적혀, 그 사이 들어온 입고를 놓칠 수 있습니다.`
      )
    )
      return;
    void runSaving(id, async () => {
      let saved: RestockItem;
      try {
        saved = await changeRestockItemStatus(id, change, item.상태);
      } catch (error) {
        console.error(error);
        if (error instanceof StaleRestockItemError) {
          // 화면을 DB의 지금 상태로 바꾸고 알린다 (DB에는 쓰지 않음)
          const current = error.current;
          setLists((prev) =>
            prev ? { ...prev, items: { ...prev.items, [id]: current } } : prev
          );
          alert(
            `다른 기기에서 먼저 바뀐 항목이라 저장하지 않았습니다.\n${describe(item)} → 지금 상태: ${describeStatus(current)}\n화면을 지금 상태로 바꿨으니 다시 확인해 주세요.`
          );
          return;
        }
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
  };

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

      {!canComputeArrival &&
        itemGroups.notPacked.length > 0 &&
        productsLoaded &&
        stockDateLoaded && (
          <p className="text-sm text-red-500">
            재고 또는 재고 기준일을 읽지 못해 입고 알림을 계산하지 못했습니다.
          </p>
        )}
      {arrivalMissingDates.length > 0 && (
        <p className="text-sm text-red-500" data-testid="restock-arrival-missing">
          판매내역이 빠진 날이 있어 입고를 놓칠 수 있습니다:{" "}
          {arrivalMissingDates.join(", ")}
        </p>
      )}
      {arrivedEntries.length > 0 && (
        <RestockItemTable
          status="notPacked"
          label="행사장으로 보낼 수 있는 상품이 들어왔습니다"
          entries={arrivedEntries}
          getCurrentStock={getCurrentStock}
          getProductName={getProductName}
          savingIds={savingIds}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
          arrivals={arrivedMap}
          testId="restock-group-arrived"
        />
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
          entries={
            status === "notPacked"
              ? itemGroups.notPacked.filter(({ id }) => !arrivedIds.has(id))
              : itemGroups[status]
          }
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
