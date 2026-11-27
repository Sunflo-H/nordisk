import { useState } from "react";
import type { RestockStatusChange } from "../../firebase/firebaseDatabase";
import type { EventCategory, RestockItem } from "../../types";
import type { ArrivalResult } from "../../utils/restockArrival";
import {
  restockReasonLabels,
  type RestockEntry,
  type RestockGroupKey,
} from "../../utils/restockView";
import StockLocationBadge from "../ProductCard/StockLocationBadge";
import ArrivalNote from "./ArrivalNote";

type RestockItemTableProps = {
  status: RestockGroupKey;
  label: string;
  entries: RestockEntry<RestockItem>[];
  // 항목의 지금 재고 (재고 엑셀에 상품이 없으면 null)
  getCurrentStock: (item: RestockItem) => number | null;
  // 상품명이 비어 있을 때 /product에서 찾은 이름
  getProductName: (item: RestockItem) => string;
  // 항목 상품의 행사장 분류 (행사장 목록에 없으면 null → 배지 없음)
  getEventCategory: (item: RestockItem) => EventCategory | null;
  // 저장 중인 항목 id (버튼을 막는다)
  savingIds: ReadonlySet<string>;
  onChangeStatus: (id: string, change: RestockStatusChange) => void;
  onDelete: (id: string) => void;
  // 입고 알림 묶음이면 항목 id → 입고 계산 근거 (근거 줄을 함께 보여 준다)
  arrivals?: ReadonlyMap<string, ArrivalResult>;
  // data-testid (기본값: restock-group-{status})
  testId?: string;
  // true면 제목을 눌러 펼치고 접는다. 처음엔 접혀 있다 (챙김·못 챙김 묶음, spec.md "챙김 묶음 접기")
  collapsible?: boolean;
};

// 상태 묶음 하나(챙길 것 / 못 챙김 / 챙김)의 표. 매장판매 항목은 챙김 묶음에 "매장판매" 표시와 함께 보인다.
const RestockItemTable = ({
  status,
  label,
  entries,
  getCurrentStock,
  getProductName,
  getEventCategory,
  savingIds,
  onChangeStatus,
  onDelete,
  arrivals,
  testId,
  collapsible = false,
}: RestockItemTableProps) => {
  // 펼침 여부는 화면 상태로만 둔다 (저장하지 않아 열 때마다 접힌 상태로 시작)
  const [isOpen, setIsOpen] = useState(false);
  const showEntries = !collapsible || isOpen;
  const title = (
    <>
      {label} <span className="text-gray-500 font-normal">{entries.length}개</span>
    </>
  );
  return (
    <section className="mt-6" data-testid={testId ?? `restock-group-${status}`}>
      {collapsible ? (
        <h3 className="font-semibold mb-2">
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            data-testid="restock-group-toggle"
            className="w-full flex items-center gap-1 cursor-pointer text-left px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <span>{title}</span>
            <span className="ml-auto text-sm text-gray-500 font-normal">
              {isOpen ? "접기 ▲" : "펼치기 ▼"}
            </span>
          </button>
        </h3>
      ) : (
        <h3 className={`font-semibold mb-2 ${arrivals ? "text-sky-700" : ""}`}>{title}</h3>
      )}
      {!showEntries ? null : entries.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">없음</p>
      ) : (
        <>
          {/* PC(sm 이상): 표 */}
          <div className="hidden sm:block overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">판매일자</th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">상품코드</th>
                  <th className="px-3 py-2 text-left font-medium">상품명</th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">칼라</th>
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">사이즈</th>
                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">수량</th>
                  <th className="px-3 py-2 text-right font-medium whitespace-nowrap">지금 재고</th>
                  {status === "notPacked" && (
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">사유 · 기준</th>
                  )}
                  <th className="px-3 py-2 text-left font-medium whitespace-nowrap">처리</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(({ id, value: item }) => {
                  const stock = getCurrentStock(item);
                  const isSaving = savingIds.has(id);
                  const arrival = arrivals?.get(id);
                  const category = getEventCategory(item);
                  return (
                    <tr
                      key={id}
                      data-testid="restock-item-row"
                      data-item-id={id}
                      className="border-t border-gray-100"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">{item.판매일자}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-mono">{item.상품코드}</span>
                        {category && (
                          <span className="ml-1.5 align-middle">
                            <StockLocationBadge location={category} />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 min-w-[160px]">
                        {getProductName(item)}
                        {item.상태 === "storeSale" && <StoreSaleBadge className="ml-1.5" />}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.칼라}</td>
                      <td className="px-3 py-2 whitespace-nowrap" title={`사이즈 코드 ${item.사이즈}`}>
                        {item.사이즈명 || item.사이즈}
                      </td>
                      <td className="px-3 py-2 text-right">{item.수량}</td>
                      <td
                        className={`px-3 py-2 text-right ${stock === 0 ? "text-red-500" : ""}`}
                        title={stock === null ? "재고 엑셀에 없는 상품" : undefined}
                      >
                        {stock ?? "-"}
                      </td>
                      {status === "notPacked" && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="font-medium">
                            {item.사유 ? restockReasonLabels[item.사유] : "사유 없음"}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            · 기준재고 {item.기준재고 ?? "-"} ({item.기준일 ?? "-"})
                          </span>
                          {arrival && <ArrivalNote arrival={arrival} />}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <ItemActions
                          item={item}
                          disabled={isSaving}
                          onChangeStatus={(change) => onChangeStatus(id, change)}
                          onDelete={() => onDelete(id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 폰·워치(sm 미만): 항목마다 카드 한 장 */}
          <ul className="sm:hidden flex flex-col gap-2">
            {entries.map(({ id, value: item }) => (
              <RestockItemCard
                key={id}
                id={id}
                item={item}
                status={status}
                stock={getCurrentStock(item)}
                category={getEventCategory(item)}
                arrival={arrivals?.get(id)}
                disabled={savingIds.has(id)}
                onChangeStatus={(change) => onChangeStatus(id, change)}
                onDelete={() => onDelete(id)}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
};

export default RestockItemTable;

// 매장판매 항목 표시 (챙김 묶음 안에서 보낸 항목과 구분)
const StoreSaleBadge = ({ className = "" }: { className?: string }) => (
  <span
    data-testid="restock-store-sale-badge"
    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap ${className}`}
  >
    매장판매
  </span>
);

type RestockItemCardProps = {
  id: string;
  item: RestockItem;
  status: RestockGroupKey;
  stock: number | null;
  // 행사장 분류 (없으면 배지 없음)
  category: EventCategory | null;
  // 입고 알림 항목이면 계산 근거
  arrival?: ArrivalResult;
  disabled: boolean;
  onChangeStatus: (change: RestockStatusChange) => void;
  onDelete: () => void;
};

// 폰·워치용 얇은 카드: 첫 줄은 상품코드(크게)·칼라·사이즈·수량·재고, 둘째 줄은 버튼 한 줄 (상품명은 보이지 않는다)
const RestockItemCard = ({
  id,
  item,
  status,
  stock,
  category,
  arrival,
  disabled,
  onChangeStatus,
  onDelete,
}: RestockItemCardProps) => (
  <li
    data-testid="restock-item-card"
    data-item-id={id}
    className={`px-2.5 py-2 bg-white rounded-lg border ${arrival ? "border-sky-400" : "border-gray-200"}`}
  >
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {/* 상품명 대신 품번(상품코드)을 메인으로 크게 보여 준다 */}
      <span className="text-base font-bold whitespace-nowrap">{item.상품코드}</span>
      {category && <StockLocationBadge location={category} />}
      <span className="text-base font-semibold whitespace-nowrap">
        {item.칼라} · {item.사이즈명 || item.사이즈}
      </span>
      <span className="text-sm whitespace-nowrap">{item.수량}개</span>
      {item.상태 === "storeSale" && <StoreSaleBadge />}
      <span
        className={`text-sm whitespace-nowrap ${stock === 0 ? "text-red-500" : "text-gray-600"}`}
        title={stock === null ? "재고 엑셀에 없는 상품" : undefined}
      >
        재고 {stock ?? "-"}
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap" title={item.판매일자}>
        {item.판매일자.slice(5)}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        aria-label="목록에서 지우기"
        className="ml-auto cursor-pointer px-1.5 py-1 text-xs text-gray-400 whitespace-nowrap hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        지우기
      </button>
    </div>
    {status === "notPacked" && (
      <p className="text-xs">
        <span className="font-medium text-amber-700">
          {item.사유 ? restockReasonLabels[item.사유] : "사유 없음"}
        </span>
        <span className="text-gray-500">
          {" "}
          · 기준재고 {item.기준재고 ?? "-"} ({item.기준일 ?? "-"})
        </span>
      </p>
    )}
    {arrival && <ArrivalNote arrival={arrival} />}
    <div className="mt-1.5">
      <MobileItemActions item={item} disabled={disabled} onChangeStatus={onChangeStatus} />
    </div>
  </li>
);

const mobileButton =
  "flex-1 min-h-10 cursor-pointer px-1 py-1.5 rounded-md text-sm leading-tight whitespace-normal break-keep disabled:opacity-40 disabled:cursor-not-allowed";

type MobileItemActionsProps = {
  item: RestockItem;
  disabled: boolean;
  onChangeStatus: (change: RestockStatusChange) => void;
};

// 폰·워치 카드의 버튼 한 줄: [챙김] [매장판매] [품절] 처럼 나란히 둔다
const MobileItemActions = ({ item, disabled, onChangeStatus }: MobileItemActionsProps) => {
  const packedButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "packed" })}
      className={`${mobileButton} grow-[1.5] bg-emerald-500 text-white font-bold hover:bg-emerald-600`}
    >
      챙김
    </button>
  );
  const undoButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "pending" })}
      className={`${mobileButton} border border-gray-300 text-gray-600 hover:bg-gray-100`}
    >
      되돌리기
    </button>
  );
  const storeSaleButton = (text: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "storeSale" })}
      className={`${mobileButton} border border-indigo-400 text-indigo-700 hover:bg-indigo-50`}
    >
      {text}
    </button>
  );
  const soldOutButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "notPacked", 사유: "soldOut" })}
      className={`${mobileButton} border border-amber-400 text-amber-700 hover:bg-amber-50`}
    >
      품절
    </button>
  );

  return (
    <div className="flex gap-1.5">
      {item.상태 === "packed" || item.상태 === "storeSale" ? (
        undoButton
      ) : item.상태 === "notPacked" ? (
        <>
          {packedButton}
          {storeSaleButton("매장판매로")}
          {undoButton}
        </>
      ) : (
        <>
          {packedButton}
          {storeSaleButton("매장판매")}
          {soldOutButton}
        </>
      )}
    </div>
  );
};

type ItemActionsProps = {
  item: RestockItem;
  disabled: boolean;
  onChangeStatus: (change: RestockStatusChange) => void;
  onDelete: () => void;
};

const buttonBase =
  "cursor-pointer px-2.5 py-1 rounded-md text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";

// PC 표의 버튼: 항목 상태에 따라 누를 수 있는 버튼
const ItemActions = ({ item, disabled, onChangeStatus, onDelete }: ItemActionsProps) => {
  const packedButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "packed" })}
      className={`${buttonBase} bg-emerald-500 text-white hover:bg-emerald-600`}
    >
      챙김
    </button>
  );
  const undoButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "pending" })}
      className={`${buttonBase} border border-gray-300 text-gray-600 hover:bg-gray-100`}
    >
      챙길 것으로 되돌리기
    </button>
  );
  const storeSaleButton = (text: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "storeSale" })}
      className={`${buttonBase} border border-indigo-400 text-indigo-700 hover:bg-indigo-50`}
    >
      {text}
    </button>
  );
  const soldOutButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "notPacked", 사유: "soldOut" })}
      className={`${buttonBase} border border-amber-400 text-amber-700 hover:bg-amber-50`}
    >
      품절
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.상태 === "packed" || item.상태 === "storeSale" ? (
        undoButton
      ) : item.상태 === "notPacked" ? (
        <>
          {packedButton}
          {storeSaleButton("매장판매로 바꾸기")}
          {undoButton}
        </>
      ) : (
        <>
          {packedButton}
          {storeSaleButton("매장판매")}
          <span className="text-gray-400 text-xs ml-1">못 챙김:</span>
          {soldOutButton}
        </>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className={`${buttonBase} text-gray-400 hover:text-red-500`}
      >
        목록에서 지우기
      </button>
    </div>
  );
};
