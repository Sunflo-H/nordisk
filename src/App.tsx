import "./App.css";
import ProductListView from "./components/ProductList/ProductListView";
import useProducts from "./hooks/useProducts";

// 노르디스크 재고 관리 페이지 (/inventory): 전체 상품 재고 조회
function App() {
  const productsData = useProducts();

  return (
    <div className="bg-gray-50 text-gray-800 h-100vh">
      <div className="max-w-[320px] m-auto ">
        <header className="text-2xl font-bold text-center mb-4 p-1">
          노르디스크 재고 관리
        </header>
        <ProductListView products={productsData} />
      </div>
    </div>
  );
}

export default App;
