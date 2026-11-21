import "./App.css";
import PageHeader from "./components/PageHeader/PageHeader";
import ProductListView from "./components/ProductList/ProductListView";
import ProductPageLayout from "./components/ProductList/ProductPageLayout";
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

  // 검색·필터 상태 (사이드바·위쪽 펼침 영역·모바일 필터가 함께 쓰고, 목록에 건다)
  const search = useProductSearchFilter(products);

  // 상품 목록을 다 읽었는데 등록된 상품이 없을 때 안내 문구를 보여 준다
  const isEmpty = isLoaded && !errorMessage && products.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <PageHeader title="노르디스크 재고 관리" />
      {/* 1024px 이상은 왼쪽 사이드바에 검색·필터, 그보다 좁은 PC는 목록 위 펼침 영역, 모바일은 필터 버튼 */}
      <ProductPageLayout search={search}>
        <SearchFilterPanel search={search} className="mt-6" />
        <div className="max-w-[320px] sm:max-w-[600px] sm:px-4 m-auto mt-6">
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
      </ProductPageLayout>
    </div>
  );
}

export default App;
