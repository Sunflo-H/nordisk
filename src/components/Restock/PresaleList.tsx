import type { RestockPresale } from "../../types";
import type { RestockEntry } from "../../utils/restockView";

type PresaleListProps = {
  // 아직 등록 완료하지 않은 선판매 항목 (정렬된 순서)
  entries: RestockEntry<RestockPresale>[];
  isOpen: boolean;
  getProductName: (item: RestockPresale) => string;
  savingIds: ReadonlySet<string>;
  onRegister: (id: string) => void;
};

// 선판매 목록 토글 버튼 (남은 항목 수 배지, 0개면 숫자를 보이지 않는다)
export const PresaleToggleButton = ({
  count,
  isOpen,
  onClick,
}: {
  count: number;
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={isOpen}
    aria-controls="restock-presale-list"
    data-testid="restock-presale-toggle"
    className={`relative shrink-0 cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium ${
      isOpen
        ? "bg-amber-500 border-amber-500 text-white"
        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
    }`}
  >
    선판매
    {count > 0 && (
      <span
        data-testid="restock-presale-count"
        className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs leading-5 text-center"
      >
        {count}
      </span>
    )}
  </button>
);

// 선판매 목록 (재고 없이 먼저 판 상품). 본사에 등록했으면 "등록 완료"를 눌러 목록에서 숨긴다.
// PC는 한 줄, 폰·워치는 내용을 여러 줄로 감싸고 버튼을 크게 보여 준다.
const PresaleList = ({
  entries,
  isOpen,
  getProductName,
  savingIds,
  onRegister,
}: PresaleListProps) => {
  if (!isOpen) return null;

  return (
    <section
      id="restock-presale-list"
      className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200"
      data-testid="restock-presale-list"
    >
      <h3 className="font-semibold mb-1">
        선판매 목록{" "}
        <span className="text-gray-500 font-normal">{entries.length}개</span>
      </h3>
      <p className="text-sm text-gray-500 mb-2">
        재고 없이 먼저 판 상품입니다. 본사에 등록했으면 "등록 완료"를 눌러 주세요.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">없음</p>
      ) : (
        <ul className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {entries.map(({ id, value: item }) => (
            <li
              key={id}
              data-testid="restock-presale-row"
              data-item-id={id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="whitespace-nowrap">{item.판매일자}</span>
                <span className="font-mono font-semibold break-all">{item.상품코드}</span>
                <span className="hidden sm:inline sm:flex-1 break-words">
                  {getProductName(item)}
                </span>
                <span className="whitespace-nowrap">
                  {item.칼라} / {item.사이즈명 || item.사이즈}
                </span>
                <span className="whitespace-nowrap">수량 {item.수량}</span>
              </span>
              <button
                type="button"
                onClick={() => onRegister(id)}
                disabled={savingIds.has(id)}
                className="shrink-0 cursor-pointer w-full sm:w-auto px-3 py-2 sm:py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                등록 완료
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default PresaleList;
