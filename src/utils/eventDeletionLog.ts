import type {
  EventCategory,
  EventCategoryMap,
  EventDeletionLogEntry,
} from "../types";

// DB 값 → 분류. 예전 값 true나 알 수 없는 값은 미분류로 본다.
function toCategory(value: unknown): EventCategory {
  return value === "event_only" || value === "both" ? value : "unclassified";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// DB에서 읽은 /event/deletionLog 값을 기록 배열로 바꾼다.
// 형식이 깨진 기록(삭제일시·방법이 없거나 상품이 비어 있음)은 건너뛰고, 최근 기록이 앞에 오게 정렬한다.
export function parseEventDeletionLog(raw: unknown): EventDeletionLogEntry[] {
  if (!isRecord(raw)) return [];
  const entries: EventDeletionLogEntry[] = [];
  for (const [id, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;
    const { 삭제일시, 방법, 상품 } = value;
    if (typeof 삭제일시 !== "string" || Number.isNaN(Date.parse(삭제일시)))
      continue;
    if (방법 !== "remove" && 방법 !== "clear") continue;
    if (!isRecord(상품)) continue;
    const products: EventCategoryMap = {};
    for (const [code, category] of Object.entries(상품))
      products[code] = toCategory(category);
    if (Object.keys(products).length === 0) continue;
    entries.push({ id, 삭제일시, 방법, 상품: products });
  }
  // 시각 문자열마다 시간대가 다를 수 있어 실제 시각으로 비교한다. 같으면 키 순서(나중 것이 앞)
  return entries.sort(
    (a, b) =>
      Date.parse(b.삭제일시) - Date.parse(a.삭제일시) ||
      b.id.localeCompare(a.id)
  );
}

// 모든 삭제 기록에서 지운 상품코드를 모아 한 번씩만, 상품코드 순으로 돌려준다.
// (행사 끝난 뒤 돌아온 재고를 PDA로 맞춰 보는 확인용 리스트)
export function listDeletedProductCodes(
  entries: EventDeletionLogEntry[]
): string[] {
  const codes = new Set<string>();
  for (const entry of entries)
    for (const code of Object.keys(entry.상품)) codes.add(code);
  return [...codes].sort();
}
