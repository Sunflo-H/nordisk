// StockManager.jsx
import { useState } from "react";
import type { ProductType } from "./types";

type StockManagerModalProps = {
  product: ProductType;
  // onClose: any;
};

const StockManagerModal: React.FC<StockManagerModalProps> = ({ product }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [stockData, setStockData] = useState(product.stock); // { "00": 1, "01": 0, ... }

  const handleSave = (size, newQty) => {
    setStockData((prev) => ({
      ...prev,
      [size]: newQty,
    }));
    setSelectedSize(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">{product.name}</h2>
      <ul className="space-y-2">
        {Object.entries(stockData).map(([size, qty]) => (
          <li
            key={size}
            onClick={() => setSelectedSize({ size, qty })}
            className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-md shadow-sm cursor-pointer hover:bg-gray-200"
          >
            <span className="font-medium">사이즈 {size}</span>
            <span>수량: {qty}</span>
          </li>
        ))}
      </ul>

      {selectedSize && (
        <StockModal
          size={selectedSize.size}
          qty={selectedSize.qty}
          onSave={handleSave}
          onClose={() => setSelectedSize(null)}
        />
      )}
    </div>
  );
};

export default StockManagerModal;
