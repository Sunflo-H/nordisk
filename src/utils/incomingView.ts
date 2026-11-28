import type {
  EventCategoryMap,
  ProductType,
  RestockIncoming,
  StockLocation,
} from "../types";
import { getStockLocation } from "./stockLocation";

// 금일 입고 전체 수량 (모든 상품·칼라·사이즈 합)
export function sumIncoming(incoming: RestockIncoming): number {
  let total = 0;
  for (const colors of Object.values(incoming.수량 ?? {})) {
    for (const sizes of Object.values(colors ?? {})) {
      for (const quantity of Object.values(sizes ?? {})) {
        if (typeof quantity === "number") total += quantity;
      }
    }
  }
  return total;
}

// 입고 상품 묶음: 행사장용 / 매장+행사장용 / 매장용 (spec.md "입고 상품 확인")
export type IncomingGroupKey = "event" | "both" | "store";

export const incomingGroupOrder: IncomingGroupKey[] = ["event", "both", "store"];

export const incomingGroupLabels: Record<IncomingGroupKey, string> = {
  event: "행사장용",
  both: "매장+행사장용",
  store: "매장용",
};

// 입고 상품 하나 (카드 한 장)
export type IncomingProductEntry = {
  상품코드: string;
  // 재고 엑셀(/product)에 있는 상품이면 그 데이터, 없으면 null (상품코드만 보인다)
  product: ProductType | null;
  // 입고된 칼라만 (재고 엑셀의 칼라 순서를 따르고, 거기 없는 칼라는 뒤에 붙인다)
  colors: string[];
  stockLocation: StockLocation;
};

export type IncomingGroups = Record<IncomingGroupKey, IncomingProductEntry[]>;

// 분류 → 묶음. 미분류(예전 값 true)는 매장+행사장용에 넣는다.
function toGroupKey(location: StockLocation): IncomingGroupKey {
  if (location === "event_only") return "event";
  if (location === "store_only") return "store";
  return "both";
}

// 금일 입고를 상품별 카드 정보로 바꾸고 분류별로 묶는다. 묶음 안은 상품코드 순.
export function groupIncomingProducts(
  incoming: RestockIncoming,
  products: ProductType[],
  eventCategories: EventCategoryMap,
): IncomingGroups {
  const productByCode = new Map(products.map((p) => [p.상품코드, p]));
  const groups: IncomingGroups = { event: [], both: [], store: [] };

  const codes = Object.keys(incoming.수량 ?? {}).sort();
  for (const code of codes) {
    const incomingColors = Object.entries(incoming.수량[code] ?? {})
      .filter(([, sizes]) =>
        Object.values(sizes ?? {}).some((q) => typeof q === "number" && q !== 0),
      )
      .map(([color]) => color);
    if (incomingColors.length === 0) continue;

    const product = productByCode.get(code) ?? null;
    const productColors = product?.칼라 ?? [];
    const colors = [
      ...productColors.filter((c) => incomingColors.includes(c)),
      ...incomingColors.filter((c) => !productColors.includes(c)),
    ];
    const stockLocation = getStockLocation(eventCategories, code);
    groups[toGroupKey(stockLocation)].push({
      상품코드: code,
      product,
      colors,
      stockLocation,
    });
  }
  return groups;
}
