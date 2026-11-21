import { Link } from "react-router";
import ExcelManager from "../components/ExcelManager/ExcelManager";
import StockDate from "../components/StockDate/StockDate";

// 앱 시작 화면: 재고 관리·행사장 재고 관리 페이지로 이동하는 네비게이션과 엑셀 데이터 관리 버튼을 제공한다.
const Home = () => {
  return (
    <div className="relative min-h-screen bg-gray-50 text-gray-800">
      {/* 재고 엑셀을 올린 날짜: 가운데 버튼과 겹치지 않게 화면 오른쪽 위에 둔다 */}
      <StockDate className="absolute top-3 right-4" />
      <div className="max-w-[320px] m-auto px-4 pt-16 flex flex-col gap-8">
        <header className="text-2xl font-bold text-center">노르디스크</header>

        <nav className="flex flex-col gap-3">
          <Link
            to="/inventory"
            className="block w-full py-3 bg-blue-500 text-white! text-center font-semibold rounded-xl shadow-md hover:bg-blue-600 transition-colors"
          >
            노르디스크 재고 관리
          </Link>
          <Link
            to="/event"
            className="block w-full py-3 bg-emerald-500 text-white! text-center font-semibold rounded-xl shadow-md hover:bg-emerald-600 transition-colors"
          >
            행사장 재고 관리
          </Link>
          {/* 행사장 판매분 챙기기는 폰·워치에서도 쓰므로 모든 화면에서 보인다 */}
          <Link
            to="/event/restock"
            className="block w-full py-3 bg-white text-emerald-600! text-center font-semibold rounded-xl shadow-md border border-emerald-500 hover:bg-emerald-50 transition-colors"
          >
            행사장 판매분 챙기기
          </Link>
          {/* 지운 행사장 상품: 재고 확인 체크를 폰에서도 쓰므로 모든 화면에서 보인다 */}
          <Link
            to="/event/deleted"
            className="block w-full py-3 bg-white text-emerald-600! text-center font-semibold rounded-xl shadow-md border border-emerald-500 hover:bg-emerald-50 transition-colors"
          >
            지운 행사장 상품
          </Link>
        </nav>

        <ExcelManager />
      </div>
    </div>
  );
};

export default Home;
