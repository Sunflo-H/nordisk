import "./App.css";
import PageHeader from "./components/PageHeader/PageHeader";
import ProductListView from "./components/ProductList/ProductListView";
import SearchFilterPanel from "./components/ProductList/SearchFilterPanel";
import useEventCategories from "./hooks/useEventCategories";
import useProducts from "./hooks/useProducts";
import useProductSearchFilter from "./hooks/useProductSearchFilter";

// 노르디스크 재고 관리 페이지 (/inventory): 전체 상품 재고 조회
function App() {
  const { products, isLoaded, errorMessage } = useProducts();
  // 카드의 "행사장만 / 매장만 / 둘 다" 배지용. 못 읽으면 배지 없이 목록만 보여 준다.
  const eventCategoriesState = useEventCategories();
  const eventCategories =
    eventCategoriesState.isLoaded && !eventCategoriesState.errorMessage
      ? eventCategoriesState.eventCategories
      : undefined;

  // 검색·필터 상태 (영역은 제목 아래, 목록은 그 아래)
  const search = useProductSearchFilter(products);

  // 상품 목록을 다 읽었는데 등록된 상품이 없을 때 안내 문구를 보여 준다
  const isEmpty = isLoaded && !errorMessage && products.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="노르디스크 재고 관리" />
      {/* 검색·필터: 행사장 "상품 선택 열기"와 같은 폭·위치 (PC·폰 모두) */}
      <SearchFilterPanel search={search} className="mt-6" />
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
        {products.length > 0 && (
          <ProductListView search={search} eventCategories={eventCategories} />
        )}
      </div>
    </div>
  );
}

export default App;
