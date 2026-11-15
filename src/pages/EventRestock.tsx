import PageHeader from "../components/PageHeader/PageHeader";
import useStoreSaleName from "../hooks/useStoreSaleName";

// 행사장 재고 챙기기 페이지 (/event/restock, PC 전용)
// 행사장에서 팔린 상품을 매장 재고에서 챙겨 보내는 일을 관리한다.
// 지금은 뼈대와 매장 판매 표시 이름 입력칸만 있다 (판매내역 업로드·챙길 목록은 이후 단계).
const EventRestock = () => {
  const { storeSaleName, setStoreSaleName } = useStoreSaleName();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="행사장 재고 챙기기" />

      {/* 모바일: 안내만 보여 준다 */}
      <p className="sm:hidden mt-10 px-4 text-center text-gray-500">
        PC에서 이용해 주세요
      </p>

      {/* PC 전용 내용 */}
      <div className="hidden sm:block max-w-[1200px] m-auto px-4 mt-6">
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
      </div>
    </div>
  );
};

export default EventRestock;
