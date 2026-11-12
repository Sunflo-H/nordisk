import "./App.css";
import PageHeader from "./components/PageHeader/PageHeader";
import ProductListView from "./components/ProductList/ProductListView";
import useProducts from "./hooks/useProducts";

// 노르디스크 재고 관리 페이지 (/inventory): 전체 상품 재고 조회
function App() {
  const productsData = useProducts();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="노르디스크 재고 관리" />
      <div className="max-w-[320px] m-auto mt-6">
        <ProductListView products={productsData} />
      </div>
    </div>
  );
}

export default App;
