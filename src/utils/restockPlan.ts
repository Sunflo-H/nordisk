import type {
  DailySales,
  RestockItem,
  RestockReturn,
  SalesDateInfo,
  SalesLine,
  SizeKey,
} from "../types";

// 판매 줄 목록 → 판매내역 업로드 계획 (DB에 쓸 값과 미리보기 숫자)
// 규칙은 spec.md "행사장 보충"의 판별·반품·중복 결정을 따른다. DB는 건드리지 않는다.

// 날짜 하나의 미리보기 숫자
export type SalesDateSummary = {
  판매일자: string;
  rowCount: number; // 판매내역 줄 수 (매장·행사장 모두)
  eventLineCount: number; // 행사장 판매 줄 수 (매장 판매 표시 이름 제외, 반품 줄 포함)
  itemCount: number; // 챙길 목록 항목 수
  returnCount: number; // 반품·교환 확인 필요 항목 수
};

export type SalesUploadPlan = {
  summaries: SalesDateSummary[]; // 새로 저장할 날짜 (날짜 순)
  skippedDates: string[]; // 이미 올려서 건너뛸 날짜 (날짜 순)
  salesDates: Record<string, SalesDateInfo>;
  sales: Record<string, DailySales>;
  items: Record<string, RestockItem>;
  returns: Record<string, RestockReturn>;
};

// 같은 날짜·상품·칼라·사이즈를 하나로 묶는 키이자 items·returns의 id.
// 같은 파일을 다시 저장해도 같은 id가 나와 항목이 두 번 생기지 않는다.
export function toRestockId(line: Pick<SalesLine, "판매일자" | "상품코드" | "칼라" | "사이즈">): string {
  return `${line.판매일자}_${line.상품코드}_${line.칼라}_${line.사이즈}`;
}

// eventCodes: 행사장 목록 상품코드, uploadedDates: 이미 올린 판매일자, uploadedAt: 오늘 날짜
export function planSalesUpload(
  lines: SalesLine[],
  eventCodes: ReadonlySet<string>,
  uploadedDates: ReadonlySet<string>,
  uploadedAt: string
): SalesUploadPlan {
  // 날짜별로 나눈다
  const linesByDate = new Map<string, SalesLine[]>();
  for (const line of lines) {
    const dateLines = linesByDate.get(line.판매일자) ?? [];
    dateLines.push(line);
    linesByDate.set(line.판매일자, dateLines);
  }

  const dates = [...linesByDate.keys()].sort();
  const plan: SalesUploadPlan = {
    summaries: [],
    skippedDates: dates.filter((date) => uploadedDates.has(date)),
    salesDates: {},
    sales: {},
    items: {},
    returns: {},
  };

  for (const date of dates) {
    if (uploadedDates.has(date)) continue;
    const dateLines = linesByDate.get(date) ?? [];

    plan.salesDates[date] = { uploadedAt, rowCount: dateLines.length };
    const dailySales = sumSales(dateLines);
    if (Object.keys(dailySales).length > 0) plan.sales[date] = dailySales;

    // 행사장 판매: 행사장 목록 상품이고, 매장 판매 표시 이름이 아닌 줄
    const eventLines = dateLines.filter(
      (line) => eventCodes.has(line.상품코드) && !line.isStoreSale
    );

    // 같은 날짜·상품·칼라·사이즈끼리 수량을 더해 판매와 반품을 서로 지운다
    const grouped = new Map<string, { line: SalesLine; 수량: number }>();
    for (const line of eventLines) {
      const id = toRestockId(line);
      const group = grouped.get(id);
      if (group) group.수량 += line.판매수량;
      else grouped.set(id, { line, 수량: line.판매수량 });
    }

    let itemCount = 0;
    let returnCount = 0;
    for (const [id, { line, 수량 }] of grouped) {
      const base = {
        판매일자: line.판매일자,
        상품코드: line.상품코드,
        상품명: line.상품명,
        칼라: line.칼라,
        사이즈: line.사이즈,
        사이즈명: line.사이즈명,
        수량,
      };
      if (수량 > 0) {
        plan.items[id] = { ...base, 상태: "pending" };
        itemCount += 1;
      } else if (수량 < 0) {
        // 짝이 없는 반품은 자동으로 처리하지 않고 확인 목록으로 보낸다
        plan.returns[id] = { ...base, 확인함: false };
        returnCount += 1;
      }
    }

    plan.summaries.push({
      판매일자: date,
      rowCount: dateLines.length,
      eventLineCount: eventLines.length,
      itemCount,
      returnCount,
    });
  }

  return plan;
}

// 하루치 판매(매장·행사장 모두)를 상품코드·칼라·사이즈별 순판매 수량으로 더한다.
// 판매와 반품이 서로 지워져 0이 된 칸은 저장하지 않는다.
function sumSales(lines: SalesLine[]): DailySales {
  const totals = new Map<string, { line: SalesLine; 수량: number }>();
  for (const line of lines) {
    const key = toRestockId(line);
    const total = totals.get(key);
    if (total) total.수량 += line.판매수량;
    else totals.set(key, { line, 수량: line.판매수량 });
  }

  const sales: DailySales = {};
  for (const { line, 수량 } of totals.values()) {
    if (수량 === 0) continue;
    const colors = (sales[line.상품코드] ??= {});
    const sizes: Partial<Record<SizeKey, number>> = (colors[line.칼라] ??= {});
    sizes[line.사이즈] = 수량;
  }
  return sales;
}
