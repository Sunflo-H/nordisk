import type { RestockItem, RestockReason, RestockStatus } from "../types";

// 챙길 목록 화면에서 쓰는 정렬·묶기·날짜 계산 (DB는 건드리지 않는다)

export type RestockEntry<T> = { id: string; value: T };

// 상태 묶음 순서와 제목
export const restockStatusGroups: { status: RestockStatus; label: string }[] = [
  { status: "pending", label: "챙길 것" },
  { status: "notPacked", label: "못 챙김" },
  { status: "packed", label: "챙김" },
];

export const restockReasonLabels: Record<RestockReason, string> = {
  keepInStore: "매장 보관",
  soldOut: "품절",
};

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

// 상태별로 나눈다. 알 수 없는 상태 값은 "챙길 것"으로 본다 (목록에서 사라지지 않도록).
export function groupByStatus(
  entries: RestockEntry<RestockItem>[]
): Record<RestockStatus, RestockEntry<RestockItem>[]> {
  const groups: Record<RestockStatus, RestockEntry<RestockItem>[]> = {
    pending: [],
    notPacked: [],
    packed: [],
  };
  for (const entry of entries) {
    const status = entry.value.상태 in groups ? entry.value.상태 : "pending";
    groups[status].push(entry);
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
