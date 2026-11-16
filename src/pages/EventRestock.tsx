import PageHeader from "../components/PageHeader/PageHeader";
import RestockBoard from "../components/Restock/RestockBoard";
import SalesUploader from "../components/Restock/SalesUploader";
import useRestockLists from "../hooks/useRestockLists";
import useStoreSaleName from "../hooks/useStoreSaleName";

// 행사장 판매분 챙기기 페이지 (/event/restock, PC·폰·워치 모두 모든 기능을 쓴다)
// 행사장에서 팔린 상품을 매장 재고에서 챙겨 보내는 일을 관리한다.
// 매장 판매 표시 이름 입력칸, 판매내역 업로드, 챙길 목록이 있다.
const EventRestock = () => {
  const { storeSaleName, setStoreSaleName } = useStoreSaleName();
  const { lists, errorMessage, reload, setLists } = useRestockLists();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="행사장 판매분 챙기기" />

      {/* 워치(약 208px)에서도 가로 스크롤이 없도록 좁은 화면은 바깥 여백을 줄인다 */}
      <div className="max-w-[1200px] m-auto px-2 sm:px-4 mt-6">
        <section className="max-w-[480px] mx-auto p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          <label
            htmlFor="store-sale-name"
            className="block font-semibold mb-1"
          >
            매장 판매 표시 이름
          </label>
          <p className="text-sm text-gray-500 mb-2">
            판매내역의 고객명이 이 이름이면 매장 판매로 봅니다. 이 브라우저에만
            저장됩니다.
          </p>
          <input
            id="store-sale-name"
            type="text"
            value={storeSaleName}
            onChange={(e) => setStoreSaleName(e.target.value)}
            placeholder="엑셀에 보이는 그대로 입력 (예: 홍*동)"
            autoComplete="off"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </section>

        <SalesUploader storeSaleName={storeSaleName} onSaved={reload} />

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
