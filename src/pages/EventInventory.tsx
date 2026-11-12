import { useState } from "react";
import EventProductPicker from "../components/EventEditor/EventProductPicker";
import ProductListView from "../components/ProductList/ProductListView";
import {
  clearEventProductCodes,
  removeEventProductCode,
} from "../firebase/firebaseDatabase";
import useEventProducts from "../hooks/useEventProducts";
import type { ProductType } from "../types";

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
  // 빼기·전체 비우기 처리 중에는 버튼을 막아 중복 요청을 막는다
  const [isRemoving, setIsRemoving] = useState(false);
  // 상품 선택 영역 열림 여부. 닫아도 컴포넌트는 남겨 두어 저장 전 체크 상태가 유지된다.
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // 확인창 → 삭제 실행 → 결과 알림 → 성공 시에만 목록 다시 읽기 (실패 시 화면은 그대로)
  const runRemoval = async (
    confirmMessage: string,
    removal: () => Promise<void>,
    successMessage: string
  ) => {
    if (!window.confirm(confirmMessage)) return;
    setIsRemoving(true);
    try {
      await removal();
    } catch (error) {
      console.error(error);
      alert("행사장 목록에서 빼지 못했습니다. 다시 시도해주세요.");
      setIsRemoving(false);
      return;
    }
    alert(successMessage);
    setIsRemoving(false);
    await reload();
  };

  // 상품 하나를 행사장 목록에서 뺀다 (원본 /product는 그대로)
  const handleRemoveOne = (productCode: string) =>
    runRemoval(
      `${productCode} 상품을 행사장 목록에서 뺄까요?`,
      () => removeEventProductCode(productCode),
      `${productCode} 상품을 행사장 목록에서 뺐습니다.`
    );

  // 행사장 목록을 전부 비운다 (원본 /product는 그대로)
  const handleClearAll = () =>
    runRemoval(
      `행사장 목록 ${eventProductCodes.length}개를 모두 비울까요?`,
      clearEventProductCodes,
      "행사장 목록을 모두 비웠습니다."
    );

  // 행사장 카드마다 붙는 "빼기" 버튼 (PC 전용)
  const renderRemoveButton = (product: ProductType) => (
    <button
      type="button"
      onClick={() => handleRemoveOne(product.상품코드)}
      disabled={isRemoving}
      className="hidden sm:block px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
    >
      빼기
    </button>
  );

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
          <button
            type="button"
            onClick={() => setIsPickerOpen((prev) => !prev)}
            aria-expanded={isPickerOpen}
            className="w-full mb-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {isPickerOpen ? "상품 선택 닫기 ▲" : "상품 선택 열기 ▼"}
          </button>
          <div className={isPickerOpen ? "" : "hidden"}>
            <EventProductPicker
              key={[...eventProductCodes].sort().join(",")}
              allProducts={allProducts}
              eventProductCodes={eventProductCodes}
              onSaved={reload}
            />
          </div>
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
        {isLoaded && !errorMessage && eventProductCodes.length > 0 && (
          // 전체 비우기 (PC 전용). /product에 없는 상품코드까지 함께 지운다.
          <div className="hidden sm:flex justify-end mb-2">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isRemoving}
              className="px-3 py-1 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              전체 비우기
            </button>
          </div>
        )}
        {eventProducts.length > 0 && (
          <ProductListView
            products={eventProducts}
            renderCardAction={renderRemoveButton}
          />
        )}
      </div>
    </div>
  );
};

export default EventInventory;
