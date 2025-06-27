import { useState } from "react";
import ProductModal from "./ProductModal";
import type { ProductType } from "./types";

type ProductCardProps = {
  product: ProductType;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 상품코드, 칼라, 판매가 } = product;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal: () => void = () => setIsOpen(true);
  const closeModal: () => void = () => setIsOpen(false);

  return (
    <>
      {/* 카드 컨테이너 */}
      <div
        className="flex flex-row justify-between items-center bg-white p-4 mb-4 shadow-md rounded-xl   text-lg font-semibold border border-gray-200 cursor-pointer"
        onClick={openModal}
      >
        <div className="w-28">{상품코드}</div>
        <div className={`flex gap-2 px-2 w-28`}>
          {칼라.map((color, i) => (
            <span
              key={i}
              className="text-xs bg-gray-100 text-gray-800 rounded-full text-center"
            >
              {color}
            </span>
          ))}
        </div>

        <div className="w-28 text-right text-blue-600">{판매가}원</div>
      </div>
      {isOpen && <ProductModal product={product} onClose={closeModal} />}
    </>
  );
};

export default ProductCard;
