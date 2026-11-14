import type { ProductType, SizeKey } from "../types";

// 상세 모달에서 쓰는 재고 계산·표시 함수 (spec.md "상세 모달 개선")

type ColorStock = ProductType["재고"][string];

// 색상 순서: 카드와 같게 `칼라` 배열 순서를 따르고, 재고에만 있는 색상은 뒤에 붙인다
export function getColorOrder(product: ProductType): string[] {
  const stockColors = Object.keys(product.재고);
  const ordered = product.칼라.filter((color) => color in product.재고);
  const rest = stockColors.filter((color) => !ordered.includes(color)).sort();
  return [...ordered, ...rest];
}

// 사이즈 코드("00"~"19")를 오름차순으로
export function getSizeKeys(stock: ColorStock): SizeKey[] {
  return (Object.keys(stock) as SizeKey[]).sort();
}

// 한 색상의 전체 수량
export function sumColorStock(stock: ColorStock): number {
  return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
}

// 상품의 전체 수량 (모든 색상·사이즈)
export function sumProductStock(product: ProductType): number {
  return Object.values(product.재고).reduce(
    (sum, stock) => sum + sumColorStock(stock),
    0
  );
}

// 수량 칸 글자 스타일: 0은 흐리게, 딱 1개는 주황색 강조
export function stockToneClass(qty: number): string {
  if (qty === 0) return "text-gray-300";
  if (qty === 1) return "text-orange-600 font-bold";
  return "";
}
