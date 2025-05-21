import { useEffect, useState } from "react";
import type { ProductType, SizeKey, StockType } from "./types";
import StockModal from "./StockModal";
import { updateData } from "./firebase/firebaseDatabase";

type ProductModalProps = {
  product: ProductType;
  onClose: () => void;
};

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | null>(
    null
  );
  const [stockData, setStockData] = useState<StockType>(product.재고);
  const [updatedProduct, setUpdatedProduct] = useState<ProductType>(product);

  let sortedSize = Object.keys(product.재고).sort() as SizeKey[];

  const handleToggleSizeView = () => {
    showAllSizes ? setShowAllSizes(false) : setShowAllSizes(true);
  };

  const handleSizeClick = (index: number) => {
    console.log("index : ", index);
    selectedSizeIndex === index
      ? setSelectedSizeIndex(null)
      : setSelectedSizeIndex(index);
    openStockModal(index);
  };

  const handleSave: (size: string, newQty: number) => void = (size, newQty) => {
    updateData(updatedProduct);
    setSelectedSizeIndex(null);
  };

  const handleIncrease: (size: SizeKey) => void = (size) => {
    setUpdatedProduct((prev) => ({
      ...prev,
      재고: {
        ...prev.재고,
        [size]: prev.재고[size]++,
      },
    }));
  };

  const handleDecrease: (size: SizeKey) => void = (size) => {
    if (product.재고[size] === 0) return;
    setUpdatedProduct((prev) => ({
      ...prev,
      재고: {
        ...prev.재고,
        [size]: prev.재고[size]--,
      },
    }));
  };

  const openStockModal: (index: number) => void = (index) => {};

  const closeStockModal = () => {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-[600px] overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="w-40 text-xl font-bold">{product.상품코드}</h2>
          <div
            className={` cursor-pointer border rounded-sm px-1 py-2 `}
            onClick={handleToggleSizeView}
          >
            {showAllSizes ? "모든 사이즈 보기" : "필요 사이즈만 보기"}
          </div>
          <div>저장</div>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 text-center">사이즈</th>
                <th className="px-4 py-2 text-center">수량</th>
              </tr>
            </thead>
            <tbody>
              {sortedSize.map((value, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    handleSizeClick(i);
                  }}
                  className={`cursor-pointer ${
                    selectedSizeIndex === i ? "bg-orange-100 " : ""
                  }`}
                >
                  <td className="px-4 py-2 text-center">{value}</td>
                  <td className="px-4 py-2 flex justify-center items-center gap-2 relative">
                    <div>{product.재고[value]}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedSizeIndex !== null ? (
            <StockModal
              size={sortedSize[selectedSizeIndex]}
              qty={updatedProduct.재고[sortedSize[selectedSizeIndex]]}
              product={product}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onSave={handleSave}
              onClose={() => setSelectedSizeIndex(null)}
            />
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
