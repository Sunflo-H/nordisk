import type { StockLocation } from "../../types";
import {
  getLocationBadges,
  locationBadgeLabels,
  type LocationBadge,
} from "../../utils/stockLocation";

// 배지 색 (매장은 파랑, 행사장은 홈의 행사장 버튼과 같은 초록 계열)
const badgeColors: Record<LocationBadge, string> = {
  store: "bg-blue-100 text-blue-700",
  event: "bg-emerald-100 text-emerald-700",
};

type StockLocationBadgeProps = {
  location: StockLocation;
};

// 상품 카드에 붙는 분류 배지: [매장] / [행사장] / 둘 다 있으면 [매장] [행사장]
const StockLocationBadge: React.FC<StockLocationBadgeProps> = ({
  location,
}) => (
  <span
    data-testid="stock-location"
    data-location={location}
    className="inline-flex items-center gap-0.5"
  >
    {getLocationBadges(location).map((badge) => (
      <span
        key={badge}
        data-testid="stock-location-badge"
        className={`px-1 py-0.5 text-[10px] font-semibold rounded whitespace-nowrap ${badgeColors[badge]}`}
      >
        {locationBadgeLabels[badge]}
      </span>
    ))}
  </span>
);

export default StockLocationBadge;
