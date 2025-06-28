import { useState } from "react";
import type { SizeKey } from "../../types";

type StockModalProps = {
  size: SizeKey;
  qty: number;
  onIncrease: (size: SizeKey) => void;
  onDecrease: (size: SizeKey) => void;
  onSave: () => void;
  onClose: () => void;
};

const StockModal: React.FC<StockModalProps> = ({
  size,
  qty,
  onIncrease,
  onDecrease,
  onSave,
  onClose,
}) => {
  const [count, setCount] = useState(qty);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 0) setCount(val);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white w-full max-w-md rounded-t-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">사이즈 {size} 수량 조절</h3>
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={() => {
              onDecrease(size);
              if (count === 0) return;
              setCount((prev) => prev - 1);
            }}
            className="text-xl bg-gray-200 px-3 py-1 rounded-full"
          >
            -
          </button>
          <input
            type="number"
            min="0"
            value={count}
            onChange={handleChange}
            className="text-center w-20 border border-gray-300 rounded-md"
          />
          <button
            onClick={() => {
              onIncrease(size);
              setCount((prev) => prev + 1);
            }}
            className="text-xl bg-gray-200 px-3 py-1 rounded-full"
          >
            +
          </button>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
          <button
            onClick={() => onSave()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;
