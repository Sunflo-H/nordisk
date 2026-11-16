import type { ArrivalResult } from "../../utils/restockArrival";

type ArrivalNoteProps = {
  arrival: ArrivalResult;
};

// 입고 알림의 계산 근거 한 줄: 입고 n개 = 지금 재고 − 기준재고 + 그 사이 판매
// (좁은 워치 화면에서도 줄바꿈되도록 덩어리마다 끊는다)
const ArrivalNote = ({ arrival }: ArrivalNoteProps) => {
  const range = arrival.판매범위;
  return (
    <p className="text-xs text-gray-600 leading-snug" data-testid="restock-arrival-note">
      <span className="font-bold text-sky-700">입고 {arrival.입고수}개</span>{" "}
      <span className="whitespace-nowrap">= 지금 재고 {arrival.지금재고}</span>
      <span className="text-gray-400"> ({arrival.지금재고일.slice(5)})</span>{" "}
      <span className="whitespace-nowrap">− 기준재고 {arrival.기준재고}</span>
      <span className="text-gray-400"> ({arrival.기준일.slice(5)})</span>{" "}
      <span className="whitespace-nowrap">+ 그 사이 판매 {arrival.그사이판매}</span>
      {range && (
        <span className="text-gray-400">
          {" "}
          ({range.from === range.to
            ? range.from.slice(5)
            : `${range.from.slice(5)}~${range.to.slice(5)}`})
        </span>
      )}
    </p>
  );
};

export default ArrivalNote;
