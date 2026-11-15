import type { RestockReturn } from "../../types";
import type { RestockEntry } from "../../utils/restockView";

type ReturnCheckListProps = {
  entries: RestockEntry<RestockReturn>[];
  getProductName: (item: RestockReturn) => string;
  savingIds: ReadonlySet<string>;
  onToggle: (id: string, checked: boolean) => void;
};

// 반품·교환 확인 필요 목록. 자동으로 처리하지 않고 "확인함"만 체크한다.
// 챙길 목록에서 지울 항목이 있으면 사용자가 아래 챙길 목록에서 직접 지운다.
const ReturnCheckList = ({
  entries,
  getProductName,
  savingIds,
  onToggle,
}: ReturnCheckListProps) => {
  const uncheckedCount = entries.filter(({ value }) => !value.확인함).length;

  return (
    <section className="mt-6" data-testid="restock-returns">
      <h3 className="font-semibold mb-1">
        반품·교환 확인 필요{" "}
        <span className="text-gray-500 font-normal">
          {entries.length}개{uncheckedCount > 0 && ` (확인 안 함 ${uncheckedCount}개)`}
        </span>
      </h3>
      <p className="text-sm text-gray-500 mb-2">
        같은 날 판매와 짝이 맞지 않는 반품입니다. 챙길 목록에서 지울 항목이
        있으면 아래 목록의 "목록에서 지우기"로 직접 지워 주세요.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">없음</p>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {entries.map(({ id, value: item }) => (
            <li key={id} data-testid="restock-return-row">
              <label className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.확인함 === true}
                  disabled={savingIds.has(id)}
                  onChange={(e) => onToggle(id, e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="whitespace-nowrap">{item.판매일자}</span>
                <span className="font-mono">{item.상품코드}</span>
                <span className="flex-1">{getProductName(item)}</span>
                <span className="whitespace-nowrap">
                  {item.칼라} / {item.사이즈명 || item.사이즈}
                </span>
                <span className="whitespace-nowrap text-red-500">수량 {item.수량}</span>
                <span className="whitespace-nowrap text-gray-500 w-14 text-right">
                  {item.확인함 ? "확인함" : ""}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ReturnCheckList;
