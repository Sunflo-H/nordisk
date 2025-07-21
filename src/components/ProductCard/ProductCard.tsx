import { useState } from "react";

import type { ProductType } from "../../types";
import ProductModal from "./ProductModal";

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
      <div
        className="
        flex justify-between items-center 
        w-full px-3 py-3 mb-2 
        bg-white border border-gray-200 shadow-md rounded-xl 
        text-sm sm:text-base font-semibold cursor-pointer"
        onClick={openModal}
      >
        <div>
          <div className="text-start text-xl mb-1">{상품코드}</div>
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
        <div className="text-lg text-blue-600 ">
          {formatNumberWithCommas(판매가)} 원
        </div>
      </div>
      {isOpen && <ProductModal product={product} onClose={closeModal} />}
    </>
  );
};

export default ProductCard;

function formatNumberWithCommas(num: number): string {
  return num.toLocaleString("en-US");
}
