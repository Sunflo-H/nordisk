import type { EventCategory, EventCategoryMap, StockLocation } from "../types";

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

// 화면에 보여 줄 이름
export const stockLocationLabels: Record<StockLocation, string> = {
  event_only: "행사장만",
  store_only: "매장만",
  both: "둘 다",
  unclassified: "미분류",
};

// 상품 선택 영역에서 고를 수 있는 분류 (미분류는 고르는 값이 아니다)
export const selectableEventCategories: Exclude<
  EventCategory,
  "unclassified"
>[] = ["event_only", "both"];
