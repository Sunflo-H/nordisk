import { useState } from "react";
import ProductModal from "./ProductModal";
export type SizeKey =
  | "00"
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08"
  | "09"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19";

export type 재고Type = {
  [key in SizeKey]: number;
};

type ProductType = {
  상품코드: string;
  상품명: string;
  칼라: string;
  수량: number;
  재고: 재고Type;
};
type ProductCardProps = {
  product: ProductType;
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
