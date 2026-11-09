import { Link } from "react-router";
import ExcelManager from "../components/ExcelManager/ExcelManager";

// 앱 시작 화면: 재고 관리 페이지로 이동하는 네비게이션과 엑셀 데이터 관리 버튼을 제공한다.
const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-[320px] m-auto px-4 pt-16 flex flex-col gap-8">
        <header className="text-2xl font-bold text-center">노르디스크</header>

        <nav>
          <Link
            to="/inventory"
            className="block w-full py-3 bg-blue-500 text-white! text-center font-semibold rounded-xl shadow-md hover:bg-blue-600 transition-colors"
          >
            노르디스크 재고 관리
          </Link>
        </nav>

        <ExcelManager />
      </div>
    </div>
  );
};

export default Home;
