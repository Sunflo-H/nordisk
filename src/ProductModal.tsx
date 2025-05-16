import { useState } from "react";

const ProductModal = ({ product, onClose }) => {
  // const [isOpen, setIsOpen] = useState(false);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [tempProductsData, setTempProductsData] = useState({});

  let sortedSize = Object.keys(product.재고).sort();

  const handleToggleSizeView = () => {
    showAllSizes ? setShowAllSizes(false) : setShowAllSizes(true);
  };

  const handleRowClick = (index: number) => {
    selectedRowIndex === index
      ? setSelectedRowIndex(null)
      : setSelectedRowIndex(index);
  };

  const handleDecreae = (index: number) => {
    console.log(product);
  };

  const handleIncreae = (num: number) => {};

  const handleUpdate = () => {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-[600px] overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="w-40 text-xl font-bold">{product.상품코드}</h2>
          <div
            className={` cursor-pointer border rounded-sm px-1 py-2 `}
            onClick={handleToggleSizeView}
          >
            {showAllSizes ? "모든 사이즈 보기" : "필요 사이즈만 보기"}
          </div>
          <div>저장</div>
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
              {sortedSize.map((value, i) => (
                <tr
                  key={i}
                  onClick={() => {
                    handleRowClick(i);
                  }}
                  className={`cursor-pointer ${
                    selectedRowIndex === i ? "bg-orange-100 " : ""
                  }`}
                >
                  <td className="px-4 py-2 text-center">{value}</td>
                  <td className="px-4 py-2 flex justify-center items-center gap-2 relative">
                    <div
                      onClick={(e) => {
                        handleDecreae(i);
                        e.stopPropagation();
                      }}
                      className={`${
                        selectedRowIndex === i
                          ? "absolute top-1/2 left-10 -translate-y-1/2 flex items-center justify-center text-xl text-red-500 w-5 h-5 text-center border rounded-full"
                          : "hidden"
                      } `}
                    >
                      -
                    </div>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`${
                        selectedRowIndex === i
                          ? "absolute top-1/2 right-10 -translate-y-1/2 flex items-center justify-center text-xl  text-green-500 w-5 h-5 border rounded-full text-center"
                          : "hidden"
                      } `}
                    >
                      +
                    </div>
                    <div>{product.재고[value]}</div>
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
