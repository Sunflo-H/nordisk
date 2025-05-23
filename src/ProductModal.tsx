import { useState } from "react";
import type { ProductType, SizeKey } from "./types";
import StockModal from "./StockModal";
import { updateData } from "./firebase/firebaseDatabase";

type ProductModalProps = {
  product: ProductType;
  onClose: () => void;
};

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  let arr = [1, 2, 3];
  console.log(arr);
  const [productState, setProductState] = useState(product);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | null>(
    null
  );
  const [updatedProduct, setUpdatedProduct] = useState<ProductType>(product);
  let sortedColor = Object.keys(product.재고).sort();
  const first_color_key = sortedColor[0];
  // const v = product.재고[first_color_key];
  const [selectedColor, setSelectedColor] = useState<string>(first_color_key);
  console.log(selectedColor);
  const 재고배열 = Object.keys(product.재고[selectedColor]).sort() as SizeKey[];

  console.log(product.재고[selectedColor][재고배열[0]]);
  // console.log(product.재고[selectedColor]["00"]);

  // size를 클릭하여 stock manager modal을 오픈하는 핸들러
  const handleOpenStockModal = (index: number) => {
    selectedSizeIndex === index
      ? setSelectedSizeIndex(null)
      : setSelectedSizeIndex(index);
  };

  const handleCloseStockModal: () => void = () => {
    setSelectedSizeIndex(null);
    setUpdatedProduct(productState);
  };

  const handleSave: () => void = () => {
    updateData(updatedProduct);
    setProductState(updatedProduct);
    setSelectedSizeIndex(null);
  };

  const handleIncrease: (size: SizeKey) => void = (size) => {
    setUpdatedProduct((prev) => ({
      ...prev,
      재고: {
        ...prev.재고,
        [size]: prev.재고[size] + 1,
      },
    }));
  };

  const handleDecrease: (size: SizeKey) => void = (size) => {
    if (product.재고[size] === 0) return;
    setUpdatedProduct((prev) => ({
      ...prev,
      재고: {
        ...prev.재고,
        [size]: prev.재고[size] - 1,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-[600px] overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="w-40 text-xl font-bold">{product.상품코드}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        <div>{}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 text-center">사이즈</th>
                <th className="px-4 py-2 text-center">수량</th>
              </tr>
            </thead>
            <tbody>
              {/* {product.재고[selectedColor].map((value, i) => (
                <div>
                  <tr
                    key={i}
                    onClick={() => {
                      handleOpenStockModal(i);
                    }}
                    className={`cursor-pointer ${
                      selectedSizeIndex === i ? "bg-orange-100 " : ""
                    }`}
                  >
                    // 여기에 color 대신 [칼라별재고]의 키값이 들어가야해 //
                    그럴려면sortedColor를 map반복하면서 다시 [칼라별재고] 를 map
                    해야겠네 // 이중 for문 써야해
                    <td className="px-4 py-2 text-center">{color}</td>
                    <td className="px-4 py-2 flex justify-center items-center gap-2 relative">
                      <div>{productState.재고[first_color_key]}</div>
                    </td>
                  </tr>
                </div>
              ))} */}
            </tbody>
          </table>
          {/* {selectedSizeIndex !== null ? (
            <StockModal
              size={sortedColor[selectedSizeIndex]}
              qty={updatedProduct.재고[sortedColor[selectedSizeIndex]]}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
              onSave={handleSave}
              onClose={handleCloseStockModal}
            />
          ) : (
            ""
          )} */}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
