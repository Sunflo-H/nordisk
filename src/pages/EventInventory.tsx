import EventProductPicker from "../components/EventEditor/EventProductPicker";
import ProductListView from "../components/ProductList/ProductListView";
import useEventProducts from "../hooks/useEventProducts";

// 행사장 재고 관리 페이지: 행사장에 보낸 상품의 재고만 보여 준다.
const EventInventory = () => {
  const {
    eventProducts,
    eventProductCodes,
    allProducts,
    isLoaded,
    errorMessage,
    reload,
  } = useEventProducts();

  // 행사장 목록을 다 읽었는데 등록된 상품코드가 없을 때 안내 문구를 보여 준다
  const isEmpty = isLoaded && !errorMessage && eventProductCodes.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-[1200px] m-auto px-4 pt-8">
        <header className="text-2xl font-bold text-center">행사장 재고 관리</header>
      </div>
      {/* 상품 선택 영역 (PC 전용). 행사장 목록을 제대로 읽은 뒤에만 보여 줘야
          읽기 실패 시 빈 목록으로 덮어쓰는 일이 없다. */}
      {isLoaded && !errorMessage && (
        <div className="hidden sm:block max-w-[600px] m-auto mt-6 px-4">
          <EventProductPicker
            key={[...eventProductCodes].sort().join(",")}
            allProducts={allProducts}
            eventProductCodes={eventProductCodes}
            onSaved={reload}
          />
        </div>
      )}
      <div className="max-w-[320px] m-auto mt-6">
        {!isLoaded && (
          <p className="text-center text-gray-500">불러오는 중...</p>
        )}
        {errorMessage && (
          <p className="text-center text-red-500">{errorMessage}</p>
        )}
        {isEmpty && (
          <p className="text-center text-gray-500">
            행사장에 등록된 상품이 없습니다
          </p>
        )}
        {eventProducts.length > 0 && (
          <ProductListView products={eventProducts} />
        )}
      </div>
    </div>
  );
};

export default EventInventory;
