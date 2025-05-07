const ProductModal = ({ product, onClose }) => {
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
                  <th className="px-4 py-2">위치</th>
                </tr>
              </thead>
              {/* <tbody>
                {product.sizes.map((size, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{size.name}</td>
                    <td className="px-4 py-2">{size.quantity}</td>
                    <td className="px-4 py-2">{size.location}</td>
                  </tr>
                ))}
              </tbody> */}
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  export default ProductModal;