import useProductUploadedAt from "../../hooks/useProductUploadedAt";

type StockDateProps = {
  className?: string;
};

// 재고 엑셀을 올린 날짜를 "재고 기준일 YYYY-MM-DD"로 보여 준다 (읽기 전용, 모바일·PC 공통)
const StockDate: React.FC<StockDateProps> = ({ className = "" }) => {
  const { uploadedAt, isLoaded, hasError } = useProductUploadedAt();

  let text = "재고 기준일 불러오는 중...";
  if (hasError) text = "재고 기준일을 불러오지 못했습니다";
  else if (isLoaded) text = `재고 기준일 ${uploadedAt ?? "기록 없음"}`;

  return <p className={`text-xs text-gray-500 ${className}`}>{text}</p>;
};

export default StockDate;
