import type { StockLocation } from "../../types";
import { stockLocationLabels } from "../../utils/stockLocation";

// 재고 위치별 배지 색 (행사장은 홈의 행사장 버튼과 같은 초록 계열)
const badgeColors: Record<StockLocation, string> = {
  event_only: "bg-emerald-100 text-emerald-700",
  store_only: "bg-blue-100 text-blue-700",
  both: "bg-violet-100 text-violet-700",
  unclassified: "bg-amber-100 text-amber-700",
};

type StockLocationBadgeProps = {
  location: StockLocation;
};

// 상품 카드에 붙는 "행사장만 / 매장만 / 둘 다 / 미분류" 배지
const StockLocationBadge: React.FC<StockLocationBadgeProps> = ({
  location,
}) => (
  <span
    data-testid="stock-location"
    className={`px-1 py-0.5 text-[10px] font-semibold rounded whitespace-nowrap ${badgeColors[location]}`}
  >
    {stockLocationLabels[location]}
  </span>
);

export default StockLocationBadge;
