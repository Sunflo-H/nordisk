import type { EventCategoryMap, StockLocation } from "../types";

// 행사장 목록에 있는 상품코드인지 (객체 기본 속성 이름과 헷갈리지 않게 자기 키만 본다)
export function isEventProduct(
  eventCategories: EventCategoryMap,
  productCode: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(eventCategories, productCode);
}

// 상품의 재고 위치: 행사장 목록에 없으면 매장만, 있으면 저장된 분류
export function getStockLocation(
  eventCategories: EventCategoryMap,
  productCode: string,
): StockLocation {
  return isEventProduct(eventCategories, productCode)
    ? eventCategories[productCode]
    : "store_only";
}

// 분류 배지 종류: 매장 / 행사장 (spec.md "분류 배지")
export type LocationBadge = "store" | "event";

export const locationBadgeLabels: Record<LocationBadge, string> = {
  store: "매장",
  event: "행사장",
};

// 분류 → 보여 줄 배지. 모든 상품은 기본이 매장이고, 행사장 목록에 있으면 행사장이 더해진다.
// 행사장만(event_only)이면 매장이 빠진다. 미분류(예전 값 true)는 매장+행사장으로 본다.
export function getLocationBadges(location: StockLocation): LocationBadge[] {
  if (location === "store_only") return ["store"];
  if (location === "event_only") return ["event"];
  return ["store", "event"];
}
