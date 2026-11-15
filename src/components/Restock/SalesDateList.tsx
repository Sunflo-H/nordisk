import type { SalesDateInfo } from "../../types";
import { findMissingDates } from "../../utils/restockView";

type SalesDateListProps = {
  salesDates: Record<string, SalesDateInfo>;
};

// 올린 판매일자 목록. 가장 이른 날과 늦은 날 사이에 빠진 날을 함께 보여 준다.
// (휴무일일 수도 있어 경고만 하고 막지는 않는다)
const SalesDateList = ({ salesDates }: SalesDateListProps) => {
  const dates = Object.keys(salesDates).sort();
  const missingDates = findMissingDates(dates);
  const allDates = [...dates, ...missingDates].sort();

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
          <ul className="flex flex-wrap gap-2">
            {allDates.map((date) => {
              const info = salesDates[date];
              return info ? (
                <li
                  key={date}
                  className="px-2.5 py-1 text-sm bg-white border border-gray-200 rounded-md"
                  title={`${info.uploadedAt}에 올림`}
                >
                  {date} <span className="text-gray-500">· {info.rowCount}줄</span>
                </li>
              ) : (
                <li
                  key={date}
                  data-testid="restock-missing-date"
                  className="px-2.5 py-1 text-sm bg-red-50 border border-red-300 text-red-600 rounded-md"
                >
                  {date} · 빠짐
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};

export default SalesDateList;
