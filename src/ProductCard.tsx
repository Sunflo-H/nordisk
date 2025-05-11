import { useState } from "react";
import ProductModal from "./ProductModal";

const ProductCard = ({ product }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <div
        className="bg-white shadow-md rounded-xl p-4 text-center text-lg font-semibold border border-gray-200 cursor-pointer"
        onClick={openModal}
      >
        <h3 className="text-lg font-semibold">{product.상품코드}</h3>
      </div>

      {isOpen && <ProductModal product={product} onClose={closeModal} />}
    </>
  );
};

export default ProductCard;
