import type { RestockStatusChange } from "../../firebase/firebaseDatabase";
import type { RestockItem, RestockStatus } from "../../types";
import { restockReasonLabels, type RestockEntry } from "../../utils/restockView";

type RestockItemTableProps = {
  status: RestockStatus;
  label: string;
  entries: RestockEntry<RestockItem>[];
  // 항목의 지금 재고 (재고 엑셀에 상품이 없으면 null)
  getCurrentStock: (item: RestockItem) => number | null;
  // 상품명이 비어 있을 때 /product에서 찾은 이름
  getProductName: (item: RestockItem) => string;
  // 저장 중인 항목 id (버튼을 막는다)
  savingIds: ReadonlySet<string>;
  onChangeStatus: (id: string, change: RestockStatusChange) => void;
  onDelete: (id: string) => void;
};

// 상태 묶음 하나(챙길 것 / 못 챙김 / 챙김)의 표
const RestockItemTable = ({
  status,
  label,
  entries,
  getCurrentStock,
  getProductName,
  savingIds,
  onChangeStatus,
  onDelete,
}: RestockItemTableProps) => {
  return (
    <section className="mt-6" data-testid={`restock-group-${status}`}>
      <h3 className="font-semibold mb-2">
        {label} <span className="text-gray-500 font-normal">{entries.length}개</span>
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">없음</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
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
                return (
                  <tr
                    key={id}
                    data-testid="restock-item-row"
                    data-item-id={id}
                    className="border-t border-gray-100"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">{item.판매일자}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-mono">{item.상품코드}</td>
                    <td className="px-3 py-2 min-w-[160px]">{getProductName(item)}</td>
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
      )}
    </section>
  );
};

export default RestockItemTable;

type ItemActionsProps = {
  item: RestockItem;
  disabled: boolean;
  onChangeStatus: (change: RestockStatusChange) => void;
  onDelete: () => void;
};

const buttonBase =
  "cursor-pointer px-2.5 py-1 rounded-md text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed";

// 항목 상태에 따라 누를 수 있는 버튼
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
  const reasonButton = (reason: "keepInStore" | "soldOut", text: string) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChangeStatus({ 상태: "notPacked", 사유: reason })}
      className={`${buttonBase} border border-amber-400 text-amber-700 hover:bg-amber-50`}
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.상태 === "packed" ? (
        undoButton
      ) : item.상태 === "notPacked" ? (
        <>
          {packedButton}
          {item.사유 === "soldOut"
            ? reasonButton("keepInStore", "매장 보관으로 바꾸기")
            : reasonButton("soldOut", "품절로 바꾸기")}
          {undoButton}
        </>
      ) : (
        <>
          {packedButton}
          <span className="text-gray-400 text-xs ml-1">못 챙김:</span>
          {reasonButton("keepInStore", "매장 보관")}
          {reasonButton("soldOut", "품절")}
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
