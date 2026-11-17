import type { RestockIncoming, SizeKey } from "../types";

// 실물재고 = 전산재고 − 금일 입고 (spec.md "금일 입고 제외")
// 기준재고 적기·선판매 나누기·입고 알림·화면 표시가 모두 이 파일의 함수를 쓴다.

// 금일 입고가 지금 재고 날짜에 적용되는지 (재고일이 다르면 지난 입고라 쓰지 않는다)
export function isIncomingActive(
  incoming: RestockIncoming | null,
  stockDate: string | null
): incoming is RestockIncoming {
  return !!incoming && !!stockDate && incoming.재고일 === stockDate;
}

// 그 칸의 금일 입고 수량 (적용되지 않으면 0)
export function getIncomingQuantity(
  incoming: RestockIncoming | null,
  stockDate: string | null,
  상품코드: string,
  칼라: string,
  사이즈: SizeKey
): number {
  if (!isIncomingActive(incoming, stockDate)) return 0;
  const quantity = incoming.수량?.[상품코드]?.[칼라]?.[사이즈];
  return typeof quantity === "number" && Number.isFinite(quantity) ? quantity : 0;
}

// 실물재고. 전산재고가 없으면(재고 엑셀에 없는 칸) undefined를 그대로 돌려준다
// (재고 0으로 볼지는 부르는 쪽 규칙을 따른다).
export function getPhysicalStock(
  systemStock: number | undefined,
  incoming: RestockIncoming | null,
  stockDate: string | null,
  상품코드: string,
  칼라: string,
  사이즈: SizeKey
): number | undefined {
  if (systemStock === undefined) return undefined;
  return systemStock - getIncomingQuantity(incoming, stockDate, 상품코드, 칼라, 사이즈);
}
