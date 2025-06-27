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
        className="flex justify-between items-center bg-white px-3 py-3 mb-2 shadow-md rounded-xl text-sm sm:text-base font-semibold border border-gray-200 cursor-pointer"
        onClick={openModal}
      >
        <div>
          <div className="text-start">{상품코드}</div>
          <div className="flex gap-1 text-start">
            {칼라.map((color, i) => (
              <span
                key={i}
                className="text-[10px] px-1 py-0.5 bg-gray-100 text-gray-800 rounded-full text-center"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
        <div className=" text-blue-600 ">{판매가} 원</div>
      </div>
      {isOpen && <ProductModal product={product} onClose={closeModal} />}
    </>
  );
};

export default ProductCard;
