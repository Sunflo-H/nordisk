import type { RestockItem, RestockReason, RestockStatus } from "../types";

// 챙길 목록 화면에서 쓰는 정렬·묶기·날짜 계산 (DB는 건드리지 않는다)

export type RestockEntry<T> = { id: string; value: T };

// 화면의 상태 묶음: 매장판매(storeSale)는 따로 묶지 않고 "챙김" 묶음에 함께 둔다
export type RestockGroupKey = Exclude<RestockStatus, "storeSale">;

// 상태 묶음 순서와 제목
export const restockStatusGroups: { status: RestockGroupKey; label: string }[] = [
  { status: "pending", label: "챙길 것" },
  { status: "notPacked", label: "못 챙김" },
  { status: "packed", label: "챙김" },
];

export const restockReasonLabels: Record<RestockReason, string> = {
  keepInStore: "매장판매", // 예전 기록에만 있는 값 (읽을 때 매장판매로 바꿔 읽는다)
  soldOut: "품절",
};

// DB에서 읽은 항목을 화면·계산에 쓸 모양으로 바꾼다.
// 예전 "매장 보관"(못 챙김 + keepInStore)은 매장판매로 바꿔 읽는다 (spec.md "매장판매").
// DB 값은 고쳐 쓰지 않으며, 남아 있는 사유·기준재고·기준일은 버린다.
export function normalizeRestockItem(item: RestockItem): RestockItem {
  if (item.상태 !== "notPacked" || item.사유 !== "keepInStore") return item;
  const next: RestockItem = { ...item, 상태: "storeSale" };
  delete next.사유;
  delete next.기준재고;
  delete next.기준일;
  return next;
}

type SortableLine = Pick<RestockItem, "판매일자" | "상품코드" | "칼라" | "사이즈">;

// 판매일자 → 상품코드 → 칼라 → 사이즈 → id 순으로 정렬한 배열
export function sortRestockEntries<T extends SortableLine>(
  record: Record<string, T>
): RestockEntry<T>[] {
  return Object.entries(record)
    .map(([id, value]) => ({ id, value }))
    .sort(
      (a, b) =>
        a.value.판매일자.localeCompare(b.value.판매일자) ||
        a.value.상품코드.localeCompare(b.value.상품코드) ||
        a.value.칼라.localeCompare(b.value.칼라) ||
        a.value.사이즈.localeCompare(b.value.사이즈) ||
        a.id.localeCompare(b.id, undefined, { numeric: true })
    );
}

// 상태별로 나눈다. 매장판매는 "챙김" 묶음에 넣는다.
// 알 수 없는 상태 값은 "챙길 것"으로 본다 (목록에서 사라지지 않도록).
export function groupByStatus(
  entries: RestockEntry<RestockItem>[]
): Record<RestockGroupKey, RestockEntry<RestockItem>[]> {
  const groups: Record<RestockGroupKey, RestockEntry<RestockItem>[]> = {
    pending: [],
    notPacked: [],
    packed: [],
  };
  for (const entry of entries) {
    const status: string = entry.value.상태;
    const group: RestockGroupKey =
      status === "storeSale"
        ? "packed"
        : status === "notPacked" || status === "packed"
          ? status
          : "pending";
    groups[group].push(entry);
  }
  return groups;
}

// 올린 판매일자 중 가장 이른 날과 늦은 날 사이에서 빠진 날짜 ("YYYY-MM-DD", 날짜 순)
export function findMissingDates(dates: string[]): string[] {
  const sorted = [...dates].filter(isDateString).sort();
  if (sorted.length < 2) return [];
  const uploaded = new Set(sorted);
  const last = sorted[sorted.length - 1];
  return [...listDatesBetween(sorted[0], last), last].filter((date) => !uploaded.has(date));
}

// from ≤ 날짜 < to 인 날짜 목록 ("YYYY-MM-DD", 날짜 순). from ≥ to 이거나 형식이 틀리면 빈 배열.
export function listDatesBetween(from: string, to: string): string[] {
  if (!isDateString(from) || !isDateString(to)) return [];
  const dates: string[] = [];
  // UTC로 하루씩 더해 시간대·서머타임 영향 없이 날짜만 센다
  const end = toUtcTime(to);
  for (let time = toUtcTime(from); time < end; time += DAY_MS) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }
  return dates;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toUtcTime(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

// 판매일자별 보기 (spec.md "판매일자별 보기")
// 고른 판매일자. "all"이면 전체.
export type SalesDateSelection = string | "all";

// 처음 고를 판매일자: 올린 판매일자 중 가장 최근. 없으면 전체.
export function getDefaultSalesDate(salesDates: Record<string, unknown>): SalesDateSelection {
  const dates = Object.keys(salesDates).filter(isDateString).sort();
  return dates.length > 0 ? dates[dates.length - 1] : "all";
}

// 고른 판매일자의 항목만 남긴다 ("챙길 것"·"챙김" 묶음에만 쓴다)
export function filterBySalesDate<T extends Pick<RestockItem, "판매일자">>(
  entries: RestockEntry<T>[],
  selection: SalesDateSelection
): RestockEntry<T>[] {
  if (selection === "all") return entries;
  return entries.filter(({ value }) => value.판매일자 === selection);
}

// 판매일자별 항목 수 ("챙길 것" 묶음을 넘겨 날짜 버튼의 남은 수로 쓴다)
export function countBySalesDate(
  entries: RestockEntry<Pick<RestockItem, "판매일자">>[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { value } of entries) {
    counts.set(value.판매일자, (counts.get(value.판매일자) ?? 0) + 1);
  }
  return counts;
}
