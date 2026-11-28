import { useMemo, useState } from "react";
import {
  changeRestockItemStatus,
  deleteRestockItem,
  setRestockPresaleRegistered,
  StaleRestockItemError,
  type RestockLists,
  type RestockStatusChange,
} from "../../firebase/firebaseDatabase";
import useEventCategories from "../../hooks/useEventCategories";
import useProducts from "../../hooks/useProducts";
import useProductUploadedAt from "../../hooks/useProductUploadedAt";
import type {
  EventCategory,
  ProductType,
  RestockItem,
  RestockPresale,
} from "../../types";
import { getPhysicalStock, isIncomingActive } from "../../utils/physicalStock";
import { computeArrival, type ArrivalResult } from "../../utils/restockArrival";
import { isEventProduct } from "../../utils/stockLocation";
import {
  countBySalesDate,
  filterBySalesDate,
  getDefaultSalesDate,
  groupByStatus,
  restockReasonLabels,
  restockStatusGroups,
  sortRestockEntries,
  type SalesDateSelection,
} from "../../utils/restockView";
import PresaleList, { PresaleToggleButton } from "./PresaleList";
import RestockItemTable from "./RestockItemTable";
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
  // 행사장 분류 배지용 (읽기만, 못 읽으면 배지 없이 목록만 보여 준다)
  const { eventCategories } = useEventCategories();
  // 행사장 목록에 없는 상품(이미 지운 상품)은 지금 분류를 알 수 없어 배지를 붙이지 않는다
  const getEventCategory = (item: RestockItem): EventCategory | null =>
    isEventProduct(eventCategories, item.상품코드) ? eventCategories[item.상품코드] : null;
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
  // 판매일자별 보기: "챙길 것"·"챙김"만 고른 날짜로 좁힌다 (입고 알림·못 챙김·선판매는 항상 모두).
  // 처음과 판매일자 목록이 바뀐 뒤(새로 올림)에는 가장 최근 판매일자. 고른 값은 저장하지 않는다.
  const salesDatesKey = Object.keys(lists.salesDates).sort().join(",");
  const [pickedDate, setPickedDate] = useState<{
    selection: SalesDateSelection;
    salesDatesKey: string;
  } | null>(null);
  const dateSelection =
    pickedDate && pickedDate.salesDatesKey === salesDatesKey
      ? pickedDate.selection
      : getDefaultSalesDate(lists.salesDates);
  const pendingCounts = useMemo(() => countBySalesDate(itemGroups.pending), [itemGroups.pending]);

  // 선판매 목록: 등록 완료하지 않은 항목만 보여 준다
  const presaleEntries = useMemo(
    () => sortRestockEntries(lists.presales).filter(({ value }) => value.등록완료 !== true),
    [lists.presales]
  );
  const [isPresaleOpen, setIsPresaleOpen] = useState(false);
  // 금일입고제외 토글: 켜면 실물재고(전산재고 − 금일 입고), 끄면 전산재고를 보여 준다. 처음에는 켜짐.
  // 보이는 숫자만 바꾸고, 입고 알림·기준재고 계산은 항상 실물재고로 한다.
  const [showPhysical, setShowPhysical] = useState(true);
  const incomingActive = isIncomingActive(lists.incoming, stockDate);

  // 재고 엑셀에 상품이 없으면 null. 상품은 있는데 그 칼라·사이즈가 없으면 전산재고 0.
  const getSystemStock = (item: ItemLine): number | null => {
    const product = productMap.get(item.상품코드);
    if (!product) return null;
    return product.재고?.[item.칼라]?.[item.사이즈] ?? 0;
  };
  const toPhysical = (item: ItemLine, systemStock: number): number =>
    getPhysicalStock(systemStock, lists.incoming, stockDate, item.상품코드, item.칼라, item.사이즈) ??
    systemStock;

  // 입고 알림: 못 챙김 항목마다 입고 수를 다시 계산한다 (DB에는 쓰지 않는다).
  // 재고나 재고 날짜를 못 읽었으면 계산하지 않는다 (재고 0으로 잘못 계산하지 않도록).
  const canComputeArrival =
    productsLoaded && !productsError && stockDateLoaded && !stockDateError && !!stockDate;
  const arrivals = useMemo(() => {
    const map = new Map<string, ArrivalResult>();
    if (!canComputeArrival || !stockDate) return map;
    for (const { id, value: item } of itemGroups.notPacked) {
      // 재고 엑셀에 그 상품·칼라·사이즈가 없으면 0 (기준재고를 적을 때와 같은 규칙)
      const systemStock = productMap.get(item.상품코드)?.재고?.[item.칼라]?.[item.사이즈] ?? 0;
      const arrival = computeArrival({
        item,
        // 토글과 상관없이 항상 실물재고 (기준재고도 실물재고로 적으므로)
        currentStock:
          getPhysicalStock(systemStock, lists.incoming, stockDate, item.상품코드, item.칼라, item.사이즈) ??
          systemStock,
        stockDate,
        sales: lists.sales,
        salesDates: lists.salesDates,
      });
      if (arrival) map.set(id, arrival);
    }
    return map;
  }, [
    canComputeArrival,
    stockDate,
    itemGroups.notPacked,
    productMap,
    lists.sales,
    lists.salesDates,
    lists.incoming,
  ]);

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

  // 화면에 보일 재고: 토글이 켜져 있고 금일 입고가 적용되면 실물재고, 아니면 전산재고
  const getCurrentStock = (item: ItemLine): number | null => {
    const systemStock = getSystemStock(item);
    if (systemStock === null) return null;
    return showPhysical ? toPhysical(item, systemStock) : systemStock;
  };
  const getProductName = (item: RestockItem | RestockPresale): string =>
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

  const handleRegisterPresale = (id: string) =>
    runSaving(id, async () => {
      const item = lists.presales[id];
      try {
        await setRestockPresaleRegistered(id, true);
      } catch (error) {
        console.error(error);
        alert(
          `저장하지 못했습니다. 화면은 그대로입니다.\n${error instanceof Error ? error.message : ""}`
        );
        return;
      }
      setLists((prev) =>
        prev
          ? {
              ...prev,
              presales: { ...prev.presales, [id]: { ...prev.presales[id], 등록완료: true } },
            }
          : prev
      );
      setMessage(`선판매 ${describe(item)} → 등록 완료 저장했습니다.`);
    });

  return (
    <div className="mt-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">챙길 목록</h2>
        <div className="flex flex-wrap items-center gap-2">
          {incomingActive && (
            <IncomingToggleButton
              isOn={showPhysical}
              onClick={() => setShowPhysical((on) => !on)}
            />
          )}
          <PresaleToggleButton
            count={presaleEntries.length}
            isOpen={isPresaleOpen}
            onClick={() => setIsPresaleOpen((open) => !open)}
          />
        </div>
      </div>
      {incomingActive && (
        <p className="mt-1 text-sm text-sky-700" data-testid="restock-stock-mode">
          {showPhysical
            ? "재고: 실물재고 (전산재고에서 금일 입고를 뺀 숫자)"
            : "재고: 전산재고 (금일 입고 포함). 입고 알림·기준재고는 실물재고로 계산합니다."}
        </p>
      )}
      <PresaleList
        entries={presaleEntries}
        isOpen={isPresaleOpen}
        getProductName={getProductName}
        savingIds={savingIds}
        onRegister={handleRegisterPresale}
      />
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
          getEventCategory={getEventCategory}
          savingIds={savingIds}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
          arrivals={arrivedMap}
          testId="restock-group-arrived"
        />
      )}

      <SalesDateList
        salesDates={lists.salesDates}
        selection={dateSelection}
        onSelect={(selection) => setPickedDate({ selection, salesDatesKey })}
        pendingCounts={pendingCounts}
      />

      {restockStatusGroups.map(({ status, label }) => (
        <RestockItemTable
          key={status}
          status={status}
          label={
            status === "notPacked" || dateSelection === "all"
              ? label
              : `${label} · ${dateSelection.slice(5)}`
          }
          entries={
            status === "notPacked"
              ? itemGroups.notPacked.filter(({ id }) => !arrivedIds.has(id))
              : filterBySalesDate(itemGroups[status], dateSelection)
          }
          getCurrentStock={getCurrentStock}
          getProductName={getProductName}
          getEventCategory={getEventCategory}
          savingIds={savingIds}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
          // 챙김 묶음(챙김·매장판매)과 못 챙김은 평소에 접어 둔다 (입고 알림·챙길 것은 늘 펼침)
          collapsible={status === "packed" || status === "notPacked"}
        />
      ))}
    </div>
  );
};

export default RestockBoard;

// 금일입고제외 토글 버튼 (금일 입고가 지금 재고 날짜에 적용될 때만 보인다)
const IncomingToggleButton = ({ isOn, onClick }: { isOn: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isOn}
    data-testid="restock-incoming-toggle"
    className={`shrink-0 cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium ${
      isOn
        ? "bg-sky-600 border-sky-600 text-white"
        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
    }`}
  >
    금일입고제외
  </button>
);

// 알림 문구용 항목 설명: "상품코드 칼라/사이즈"
function describe(item: ItemLine): string {
  return `${item.상품코드} ${item.칼라}/${item.사이즈명 || item.사이즈}`;
}

function describeStatus(item: RestockItem): string {
  if (item.상태 === "packed") return "챙김";
  if (item.상태 === "storeSale") return "매장판매";
  if (item.상태 === "notPacked")
    return `못 챙김(${item.사유 ? restockReasonLabels[item.사유] : "사유 없음"}, 기준재고 ${item.기준재고})`;
  return "챙길 것";
}
