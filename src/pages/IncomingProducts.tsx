import { useMemo } from "react";
import PageHeader from "../components/PageHeader/PageHeader";
import ProductCard from "../components/ProductCard/ProductCard";
import StockLocationBadge from "../components/ProductCard/StockLocationBadge";
import IncomingUploader from "../components/Restock/IncomingUploader";
import useIncomingPageData, {
  type IncomingPageData,
} from "../hooks/useIncomingPageData";
import {
  groupIncomingProducts,
  incomingGroupLabels,
  incomingGroupOrder,
  sumIncoming,
  type IncomingProductEntry,
} from "../utils/incomingView";

// 입고 상품 확인 페이지 (/incoming)
// 금일 입고 엑셀을 올리고(PC 전용), 마지막으로 올린 입고 상품을
// 행사장용 / 매장+행사장용 / 매장용으로 묶어 본다 (폰에서도 보기만 가능).
const IncomingProducts = () => {
  const { data, errorMessage, reload } = useIncomingPageData();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="입고 상품 확인" />

      <div className="max-w-[320px] sm:max-w-[600px] sm:px-4 m-auto mt-6 pb-10">
        {/* 금일 입고 업로드는 PC 전용 (컴포넌트 안에서 hidden sm:block) */}
        <IncomingUploader incoming={data?.incoming ?? null} onSaved={reload} />

        {errorMessage && (
          <p className="mt-8 text-center text-red-500">{errorMessage}</p>
        )}
        {!data && !errorMessage && (
          <p className="mt-8 text-center text-gray-500">불러오는 중...</p>
        )}
        {data && <IncomingList data={data} />}
      </div>
    </div>
  );
};

export default IncomingProducts;

// 입고 요약 줄 + 분류별 묶음
const IncomingList = ({ data }: { data: IncomingPageData }) => {
  const { incoming, products, eventCategories, stockDate } = data;
  const groups = useMemo(
    () =>
      incoming ? groupIncomingProducts(incoming, products, eventCategories) : null,
    [incoming, products, eventCategories],
  );

  if (!incoming || !groups) {
    return (
      <p data-testid="incoming-empty" className="mt-8 text-center text-gray-500">
        올린 금일 입고가 없습니다
      </p>
    );
  }

  // 재고일이 지금 재고 날짜와 다르면 지난 입고라 실물재고 계산에 쓰이지 않는다
  const isPast = incoming.재고일 !== stockDate;

  return (
    <div className="mt-6">
      <p data-testid="incoming-summary" className="text-sm text-center text-gray-600">
        재고일 {incoming.재고일} · 올린 날 {incoming.uploadedAt || "기록 없음"} ·{" "}
        {sumIncoming(incoming)}장
      </p>
      {isPast && (
        <p
          data-testid="incoming-past-note"
          className="mt-2 px-3 py-2 text-sm text-center text-amber-800 bg-amber-50 border border-amber-200 rounded-lg"
        >
          지금 재고 날짜({stockDate ?? "기록 없음"})보다 지난 입고라 재고 계산에는 쓰이지 않습니다.
        </p>
      )}

      {incomingGroupOrder.map((key) => (
        <section key={key} data-testid="incoming-group" data-group={key} className="mt-6">
          <h2 className="mb-2 font-semibold">
            {incomingGroupLabels[key]}{" "}
            <span data-testid="incoming-group-count" className="text-gray-500">
              {groups[key].length}개
            </span>
          </h2>
          {groups[key].length === 0 ? (
            <p className="text-sm text-gray-400">없음</p>
          ) : (
            groups[key].map((entry) => (
              <IncomingCard key={entry.상품코드} entry={entry} />
            ))
          )}
        </section>
      ))}
    </div>
  );
};

// 입고 상품 카드: 재고 목록 카드 그대로(칼라 칩은 입고된 칼라만). 재고 엑셀에 없는 상품은 상품코드만.
const IncomingCard = ({ entry }: { entry: IncomingProductEntry }) => {
  if (entry.product) {
    return (
      <div data-testid="incoming-card" data-code={entry.상품코드}>
        <ProductCard
          product={entry.product}
          stockLocation={entry.stockLocation}
          colors={entry.colors}
        />
      </div>
    );
  }
  return (
    <div
      data-testid="incoming-card"
      data-code={entry.상품코드}
      className="w-full px-3 py-3 mb-2 bg-white border border-gray-200 shadow-md rounded-xl font-semibold"
    >
      <div className="text-xl mb-1">{entry.상품코드}</div>
      <StockLocationBadge location={entry.stockLocation} />
    </div>
  );
};
