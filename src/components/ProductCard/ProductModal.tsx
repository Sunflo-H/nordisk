import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

import type { ProductType } from "../../types";
import {
  getColorOrder,
  getSizeKeys,
  stockToneClass,
  sumColorStock,
  sumProductStock,
} from "../../utils/stock";

type ProductModalProps = {
  product: ProductType;
  onClose: () => void;
};

// 상품 상세 모달: 상품 정보 + 색상 탭 + 사이즈별 수량 표 (읽기 전용)
const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const colors = getColorOrder(product);
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? "");
  // 수량 0인 사이즈도 보여 줄지 (기본: 숨김, 색상을 바꿔도 유지)
  const [showZero, setShowZero] = useState<boolean>(false);
  const selectedStock = product.재고[selectedColor] ?? {};
  const sizeKeys = getSizeKeys(selectedStock).filter(
    (size) => showZero || selectedStock[size] !== 0
  );
  const productTotal = sumProductStock(product);

  // ESC로 닫기 + 열려 있는 동안 뒤 목록 스크롤 막기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const titleId = `product-modal-title-${product.상품코드}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      // 바깥(어두운 배경)을 눌렀을 때만 닫는다. 모달 안쪽 클릭은 무시한다.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="p-6 rounded-lg w-[90%] max-w-[600px] max-h-[90vh] bg-white overflow-auto"
      >
        {/* 상단: 상품 정보 */}
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold">
              {product.상품코드}
            </h2>
            <p className="text-sm text-gray-700 break-keep">{product.상품명}</p>
            <p className="text-xs text-gray-500">
              {product.연도}년 · {product.성별} · {product.카테고리}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 text-black hover:text-blue-600 cursor-pointer"
          >
            <IoClose className="text-4xl" />
          </button>
        </div>
        <div className="flex justify-between items-baseline mt-3 mb-4">
          <span className="text-lg font-semibold text-blue-600">
            {product.판매가.toLocaleString("en-US")} 원
          </span>
          <span className="text-sm text-gray-700">
            전체 재고{" "}
            <span data-testid="product-total" className="font-bold">
              {productTotal}
            </span>
            개
          </span>
        </div>

        {/* 색상 탭: 색상별 합계 표시, 많으면 줄바꿈 */}
        <div className="flex flex-wrap gap-1 mb-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              aria-pressed={selectedColor === color}
              className={`px-3 py-1 rounded-lg font-bold text-sm cursor-pointer transition-colors ${
                selectedColor === color
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {color} ({sumColorStock(product.재고[color])})
            </button>
          ))}
        </div>

        <label className="flex items-center justify-end gap-1.5 mb-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showZero}
            onChange={(event) => setShowZero(event.target.checked)}
          />
          0개 사이즈도 보기
        </label>

        {/* 사이즈별 수량 표: 0은 기본 숨김(보일 땐 흐리게), 1개는 주황색 */}
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-center">사이즈</th>
              <th className="px-4 py-2 text-center">수량</th>
            </tr>
          </thead>
          <tbody>
            {sizeKeys.map((size) => {
              const qty = selectedStock[size];
              const tone = stockToneClass(qty);
              return (
                <tr key={size}>
                  <td className={`px-4 py-2 text-center ${tone}`}>{size}</td>
                  <td className={`px-4 py-2 text-center ${tone}`}>{qty}</td>
                </tr>
              );
            })}
            {sizeKeys.length === 0 && (
              // 0을 숨겼는데 이 색상 재고가 전부 0인 경우
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                  이 색상은 재고가 없습니다
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-300 font-bold">
              <td className="px-4 py-2 text-center">합계</td>
              <td data-testid="color-total" className="px-4 py-2 text-center">
                {sumColorStock(selectedStock)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ProductModal;
