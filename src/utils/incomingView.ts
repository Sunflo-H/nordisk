import type { RestockIncoming } from "../types";

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
