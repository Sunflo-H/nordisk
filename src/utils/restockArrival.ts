import type { DailySales, RestockItem, SalesDateInfo } from "../types";
import { listDatesBetween } from "./restockView";

// 입고 알림 계산 (spec.md "보낼 수 있음 기준", DB에는 쓰지 않는다)
// 입고 수 = 지금 재고 − 기준재고 + 그 사이 판매
// "그 사이 판매"는 기준일 ≤ 판매일자 < 지금 재고 날짜 (2026-11-16 사용자 결정).
// 재고 엑셀을 아직 새로 올리지 않았으면 판매를 더하지 않아, 판매내역을 먼저 올려도 가짜 알림이 뜨지 않는다.

export type ArrivalResult = {
  입고수: number;
  기준재고: number;
  기준일: string;
  지금재고: number;
  지금재고일: string;
  // 그 사이 판매 합계 (반품을 뺀 순판매, 행사장·매장 모두)
  그사이판매: number;
  // 판매를 센 날짜 범위 (센 날이 없으면 null)
  판매범위: { from: string; to: string } | null;
  // 판매를 세야 하는데 판매내역을 올리지 않은 날 (입고를 놓칠 수 있다)
  빠진날: string[];
};

type ArrivalInput = {
  item: Pick<RestockItem, "상품코드" | "칼라" | "사이즈" | "상태" | "기준재고" | "기준일">;
  // 지금 재고 (재고 엑셀에 그 칼라·사이즈가 없으면 0으로 넘긴다)
  currentStock: number;
  // 지금 재고 날짜 (/meta/productUploadedAt)
  stockDate: string;
  // /restock/sales 전체 (판매일자 → 상품코드 → 칼라 → 사이즈 → 수량)
  sales: Record<string, DailySales>;
  // /restock/salesDates (올린 판매일자)
  salesDates: Record<string, SalesDateInfo>;
};

// 못 챙김 항목 하나의 입고 수와 근거. 기준재고·기준일이 없거나 계산할 수 없으면 null.
export function computeArrival({
  item,
  currentStock,
  stockDate,
  sales,
  salesDates,
}: ArrivalInput): ArrivalResult | null {
  if (item.상태 !== "notPacked") return null;
  const { 기준재고, 기준일 } = item;
  if (typeof 기준재고 !== "number" || !Number.isFinite(기준재고)) return null;
  if (!기준일 || !isDateString(기준일) || !isDateString(stockDate)) return null;
  if (!Number.isFinite(currentStock)) return null;

  // 기준일부터 지금 재고 날짜 전날까지 (기준일 ≥ 지금 재고 날짜면 빈 범위)
  const countDates = listDatesBetween(기준일, stockDate);
  let 그사이판매 = 0;
  const 빠진날: string[] = [];
  for (const date of countDates) {
    if (!salesDates[date]) {
      빠진날.push(date);
      continue;
    }
    const quantity = sales[date]?.[item.상품코드]?.[item.칼라]?.[item.사이즈];
    if (typeof quantity === "number" && Number.isFinite(quantity)) 그사이판매 += quantity;
  }

  return {
    입고수: currentStock - 기준재고 + 그사이판매,
    기준재고,
    기준일,
    지금재고: currentStock,
    지금재고일: stockDate,
    그사이판매,
    판매범위:
      countDates.length > 0
        ? { from: countDates[0], to: countDates[countDates.length - 1] }
        : null,
    빠진날,
  };
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
