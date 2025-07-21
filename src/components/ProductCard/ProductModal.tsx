import { useState } from "react";

// import StockModal from "./StockModal";
import type { ProductType, SizeKey } from "../../types";
import { updateData } from "../../firebase/firebaseDatabase";
import { IoClose } from "react-icons/io5";

type ProductModalProps = {
  product: ProductType;
  onClose: () => void;
};

const sizeList: SizeKey[] = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
];

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const [productState, setProductState] = useState(product);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | null>(
    null
  );
  let sortedColor = Object.keys(product.재고).sort();
  const first_color_key = sortedColor[0];
  const [selectedColor, setSelectedColor] = useState<string>(first_color_key);
  const 재고배열 = Object.keys(product.재고[selectedColor]).sort() as SizeKey[];
  console.log(product.재고[selectedColor]);
  // size를 클릭하여 stock manager modal을 오픈하는 핸들러
  const handleOpenStockModal = (index: number) => {
    selectedSizeIndex === index
      ? setSelectedSizeIndex(null)
      : setSelectedSizeIndex(index);
  };

  const handleChangeColor: (color: string) => void = (color) => {
    setSelectedColor(color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="p-6 rounded-lg w-[90%] max-w-[600px] max-h-[90vh] bg-white overflow-auto ">
        <div className="flex justify-between items-center">
          <h2 className="w-40 text-xl font-bold">{product.상품코드}</h2>

          <button
            onClick={onClose}
            className="text-black hover:text-blue-600 cursor-pointer"
          >
            <IoClose className=" font-bold text-4xl" />
          </button>
        </div>
        <div className="flex gap-1">
          {sortedColor.map((color) => (
            <h2
              key={color}
              onClick={() => handleChangeColor(color)}
              className={`w-14 py-1 rounded-t-lg font-bold text-center cursor-pointer 
                ${
                  selectedColor === color
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
            >
              {color}
            </h2>
          ))}
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
              {재고배열.map((size, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    handleOpenStockModal(i);
                  }}
                  className={`cursor-pointer ${
                    selectedSizeIndex === i ? "bg-blue-100 " : ""
                  }`}
                >
                  <td className="px-4 py-2 text-center">{size}</td>
                  <td className="px-4 py-2 flex justify-center items-center gap-2 relative">
                    <div>{productState.재고[selectedColor][size]}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
