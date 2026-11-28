import PageHeader from "../components/PageHeader/PageHeader";
import RestockBoard from "../components/Restock/RestockBoard";
import useRestockLists from "../hooks/useRestockLists";

// 행사장 판매분 챙기기 페이지 (/event/restock, 챙길 목록은 PC·폰·워치 모두 쓴다)
// 행사장에서 팔린 상품을 매장 재고에서 챙겨 보내는 일을 관리한다.
// 판매내역·금일 입고 업로드와 매장 판매 표시 이름 입력은 홈 업로드 묶음(PC 전용)으로 옮겼다 (2026-11-28, Phase 31).
const EventRestock = () => {
  const { lists, errorMessage, setLists } = useRestockLists();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="행사장 판매분 챙기기" />

      {/* 워치(약 208px)에서도 가로 스크롤이 없도록 좁은 화면은 바깥 여백을 줄인다 */}
      <div className="max-w-[1200px] m-auto px-2 sm:px-4 mt-6">
        {errorMessage && (
          <p className="mt-8 text-center text-red-500">{errorMessage}</p>
        )}
        {!lists && !errorMessage && (
          <p className="mt-8 text-center text-gray-500">불러오는 중...</p>
        )}
        {lists && <RestockBoard lists={lists} setLists={setLists} />}
      </div>
    </div>
  );
};

export default EventRestock;
