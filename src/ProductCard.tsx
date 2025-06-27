import { useState } from "react";
import ProductModal from "./ProductModal";
import type { ProductType } from "./types";

type ProductCardProps = {
  product: ProductType;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 상품코드, 칼라, 판매가 } = product;
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const colors = 칼라.join(", "); // 칼라 배열을 문자열로 변환
  const openModal: () => void = () => setIsOpen(true);
  const closeModal: () => void = () => setIsOpen(false);

  return (
    <>
      {/* 카드 컨테이너 */}
      <div
        className="flex flex-row justify-between items-center bg-white p-4 shadow-md rounded-xl   text-lg font-semibold border border-gray-200 cursor-pointer"
        onClick={openModal}
      >
        <div className="w-1/3">{상품코드}</div>
        <div className="w-1/3 text-sm text-gray-500">{colors}</div>
        <div className="w-1/3 text-right text-blue-500">{판매가}원</div>
      </div>
      {isOpen && <ProductModal product={product} onClose={closeModal} />}
    </>
  );
};

export default ProductCard;
