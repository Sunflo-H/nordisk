import ProductListView from "../components/ProductList/ProductListView";
import useEventProducts from "../hooks/useEventProducts";

// 행사장 재고 관리 페이지: 행사장에 보낸 상품의 재고만 보여 준다.
const EventInventory = () => {
  const { eventProducts, eventProductCodes, isLoaded, errorMessage } =
    useEventProducts();

  // 행사장 목록을 다 읽었는데 등록된 상품코드가 없을 때 안내 문구를 보여 준다
  const isEmpty = isLoaded && !errorMessage && eventProductCodes.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-[1200px] m-auto px-4 pt-8">
        <header className="text-2xl font-bold text-center">행사장 재고 관리</header>
      </div>
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
