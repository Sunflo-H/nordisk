import type { ProductType } from "../types";

// 엑셀 업로드 전 확인창에 보여 줄 요약
export type UploadSummary = {
  // 새 엑셀의 상품 수
  totalCount: number;
  // DB엔 없고 새 엑셀에만 있는 상품코드
  addedCodes: string[];
  // DB엔 있는데 새 엑셀엔 없어 지워질 상품코드
  removedCodes: string[];
  // 양쪽에 다 있고 재고나 판매가가 바뀐 상품코드
  changedCodes: string[];
};

// 현재 DB 상품과 새 엑셀 상품을 비교해 요약을 만든다
export function summarizeUpload(
  currentProducts: ProductType[],
  nextProducts: ProductType[]
): UploadSummary {
  const currentMap = new Map(
    currentProducts.map((product) => [product.상품코드, product])
  );
  const nextCodes = new Set(nextProducts.map((product) => product.상품코드));

  const addedCodes: string[] = [];
  const changedCodes: string[] = [];
  nextProducts.forEach((next) => {
    const current = currentMap.get(next.상품코드);
    if (!current) {
      addedCodes.push(next.상품코드);
      return;
    }
    const isChanged =
      current.판매가 !== next.판매가 ||
      stableStringify(current.재고) !== stableStringify(next.재고);
    if (isChanged) changedCodes.push(next.상품코드);
  });

  const removedCodes = currentProducts
    .map((product) => product.상품코드)
    .filter((code) => !nextCodes.has(code));

  return {
    totalCount: nextProducts.length,
    addedCodes,
    removedCodes,
    changedCodes,
  };
}

// 객체 키 순서와 상관없이 같은 내용이면 같은 문자열이 되도록 직렬화한다
// (DB에서 읽은 데이터는 키가 정렬되어 오므로 엑셀 순서와 다를 수 있다)
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
  return `{${entries.join(",")}}`;
}
