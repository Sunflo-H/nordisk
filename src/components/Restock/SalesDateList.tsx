import { useState } from "react";
import type { SalesDateInfo } from "../../types";
import { findMissingDates, type SalesDateSelection } from "../../utils/restockView";

type SalesDateListProps = {
  salesDates: Record<string, SalesDateInfo>;
  // 고른 판매일자 ("all"이면 전체)
  selection: SalesDateSelection;
  onSelect: (selection: SalesDateSelection) => void;
  // 판매일자별 남은 "챙길 것" 수
  pendingCounts: Map<string, number>;
};

// 버튼으로 바로 보이는 최근 날짜 수. 나머지는 "더 보기"로 펼친다.
const VISIBLE_DATE_COUNT = 7;

// 올린 판매일자 목록. 날짜를 누르면 그날 판매분만 본다 (spec.md "판매일자별 보기").
// 가장 이른 날과 늦은 날 사이에 빠진 날을 함께 보여 준다 (휴무일일 수도 있어 경고만 하고 막지는 않는다).
const SalesDateList = ({ salesDates, selection, onSelect, pendingCounts }: SalesDateListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dates = Object.keys(salesDates).sort();
  const missingDates = findMissingDates(dates);
  // 최근 날짜가 앞에 오게 한다
  const allDates = [...dates, ...missingDates].sort().reverse();
  const visibleDates = isExpanded ? allDates : allDates.slice(0, VISIBLE_DATE_COUNT);
  const hiddenDates = allDates.slice(VISIBLE_DATE_COUNT);
  const hiddenPending = hiddenDates.reduce((sum, date) => sum + (pendingCounts.get(date) ?? 0), 0);
  const totalPending = [...pendingCounts.values()].reduce((sum, count) => sum + count, 0);

  return (
    <section className="mt-6" data-testid="restock-sales-dates">
      <h3 className="font-semibold mb-1">
        올린 판매일자 <span className="text-gray-500 font-normal">{dates.length}일</span>
      </h3>
      {dates.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">아직 올린 판매내역이 없습니다</p>
      ) : (
        <>
          {missingDates.length > 0 && (
            <p className="text-sm text-red-500 mb-2">
              빠진 날이 {missingDates.length}일 있습니다. 판매내역을 올리지 않았다면
              올려 주세요 (휴무일이면 그대로 두면 됩니다).
            </p>
          )}
          <p className="text-xs text-gray-500 mb-1.5">
            날짜를 누르면 그날 판매분의 챙길 것·챙김만 봅니다. 숫자는 남은 챙길 것.
          </p>
          <ul className="flex flex-wrap gap-1.5 sm:gap-2">
            <li>
              <DateButton
                label="전체"
                isSelected={selection === "all"}
                pending={totalPending}
                onClick={() => onSelect("all")}
                testId="restock-date-all"
              />
            </li>
            {visibleDates.map((date) => {
              const info = salesDates[date];
              return info ? (
                <li key={date}>
                  <DateButton
                    label={date.slice(5)}
                    title={`${date} 판매 ${info.rowCount}줄 (${info.uploadedAt}에 올림)`}
                    isSelected={selection === date}
                    pending={pendingCounts.get(date) ?? 0}
                    onClick={() => onSelect(date)}
                    testId={`restock-date-${date}`}
                  />
                </li>
              ) : (
                <li
                  key={date}
                  data-testid="restock-missing-date"
                  title={`${date} 판매내역을 올리지 않음`}
                  className="px-2.5 py-1.5 text-sm bg-red-50 border border-red-300 text-red-600 rounded-md"
                >
                  {date.slice(5)} 빠짐
                </li>
              );
            })}
            {hiddenDates.length > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setIsExpanded((expanded) => !expanded)}
                  aria-expanded={isExpanded}
                  data-testid="restock-date-more"
                  className="cursor-pointer px-2.5 py-1.5 text-sm text-gray-600 border border-dashed border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {isExpanded ? "접기" : `더 보기 ${hiddenDates.length}일`}
                  {!isExpanded && hiddenPending > 0 && (
                    <span className="ml-1 font-semibold text-amber-600">· {hiddenPending}</span>
                  )}
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  );
};

export default SalesDateList;

type DateButtonProps = {
  label: string;
  title?: string;
  isSelected: boolean;
  // 남은 "챙길 것" 수 (0이면 숫자를 보이지 않는다)
  pending: number;
  onClick: () => void;
  testId: string;
};

const DateButton = ({ label, title, isSelected, pending, onClick, testId }: DateButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-pressed={isSelected}
    data-testid={testId}
    className={`cursor-pointer px-2.5 py-1.5 text-sm rounded-md border ${
      isSelected
        ? "bg-gray-800 border-gray-800 text-white"
        : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"
    }`}
  >
    {label}
    {pending > 0 && (
      <span
        className={`ml-1 font-semibold ${isSelected ? "text-amber-300" : "text-amber-600"}`}
        data-testid="restock-date-pending"
      >
        · {pending}
      </span>
    )}
  </button>
);
