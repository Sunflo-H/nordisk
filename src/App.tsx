import "./App.css";
import PageHeader from "./components/PageHeader/PageHeader";
import ProductListView from "./components/ProductList/ProductListView";
import useProducts from "./hooks/useProducts";

// 노르디스크 재고 관리 페이지 (/inventory): 전체 상품 재고 조회
function App() {
  const { products, isLoaded, errorMessage } = useProducts();

  // 상품 목록을 다 읽었는데 등록된 상품이 없을 때 안내 문구를 보여 준다
  const isEmpty = isLoaded && !errorMessage && products.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="노르디스크 재고 관리" />
      <div className="max-w-[320px] m-auto mt-6">
        {!isLoaded && (
          <p className="text-center text-gray-500">불러오는 중...</p>
        )}
        {errorMessage && (
          <p className="text-center text-red-500">{errorMessage}</p>
        )}
        {isEmpty && (
          <p className="text-center text-gray-500">등록된 상품이 없습니다</p>
        )}
        {products.length > 0 && <ProductListView products={products} />}
      </div>
    </div>
  );
}

export default App;
