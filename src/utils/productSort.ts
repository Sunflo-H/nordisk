import type { ProductType } from "../types";

// 목록 정렬 방식 (spec.md "숫자순 정렬")
// code: 상품코드 전체 글자순 (DB에서 읽은 순서 그대로) / number: 앞 영문 3자리를 뒤로 보낸 순서
export type ProductSortMode = "code" | "number";

// 앞 영문 3자리(브랜드·성별·계절) 길이
const PREFIX_LENGTH = 3;

// 상품코드의 앞 3자리를 뒤 괄호로 보낸다. 예: OUU25201 → 25201(OUU), OMA24G01 → 24G01(OMA)
// 3자리 이하의 짧은 코드는 그대로 둔다.
export function toNumberFirstCode(code: string): string {
  if (code.length <= PREFIX_LENGTH) return code;
  return `${code.slice(PREFIX_LENGTH)}(${code.slice(0, PREFIX_LENGTH)})`;
}

// 숫자순 비교: 바꾼 코드(25201(OUU))의 글자 순서. 숫자 부분이 같으면 괄호 안 영문 순서가 된다.
function compareNumberFirst(a: string, b: string): number {
  const keyA = toNumberFirstCode(a);
  const keyB = toNumberFirstCode(b);
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}

// 정렬 방식에 맞춘 상품 목록. 코드순이면 받은 순서 그대로 돌려준다 (원본 배열은 바꾸지 않는다).
export function sortProducts(
  products: ProductType[],
  mode: ProductSortMode
): ProductType[] {
  if (mode === "code") return products;
  return [...products].sort((a, b) => compareNumberFirst(a.상품코드, b.상품코드));
}

// 카드에 보일 상품코드 (숫자순일 때만 25201(OUU) 모양)
export function getDisplayCode(code: string, mode: ProductSortMode): string {
  return mode === "number" ? toNumberFirstCode(code) : code;
}
