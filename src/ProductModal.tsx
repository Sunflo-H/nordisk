const ProductModal = ({ product, onClose }) => {
  let 사이즈별재고 = Object.keys(product.재고).sort();
  console.log(사이즈별재고);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-[600px] overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">사이즈</th>
                <th className="px-4 py-2">수량</th>
              </tr>
            </thead>
            <tbody>
              {사이즈별재고.map((value, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{value}</td>
                  <td className="px-4 py-2">{product.재고[value]}</td>
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
