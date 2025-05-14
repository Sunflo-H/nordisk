import { useState } from "react";
import ProductDetailModal from "./ProductDetailModal";

const ProductModal = ({ product, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActiveOption, setIsActiveOption] = useState(true);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  let 사이즈별재고 = Object.keys(product.재고).sort();
  const arr = product.재고;
  console.log(arr);

  const toggleActiveOption = () => {
    isActiveOption ? setIsActiveOption(false) : setIsActiveOption(true);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-[600px] overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="w-40 border text-xl font-bold">{product.상품코드}</h2>
          <div className="cursor-pointer" onClick={}>
            필요 사이즈만
          </div>
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
              {사이즈별재고.map((value, i) => (
                <tr key={i} onClick={openModal}>
                  <td className="px-4 py-2 text-center">{value}</td>
                  <td className="px-4 py-2 text-center">
                    {product.재고[value]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isOpen && (
            <ProductDetailModal product={product} onClose={closeModal} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
