const ProductDetailModal=({product, onClose}) => {

    return(
        <div className="fixed inset-0 z-50 bg-white/50  flex flex-col justify-center border w-[90%]">
            <div className="text-xl">X</div>
            <div className="flex justify-center gap-4">
                <div className="bg-red-500 border rounded-sm w-[2%] font-bold">-</div>
                <div>1</div>
                <div className="bg-green-500 border rounded-sm w-[2%] font-bold">+</div>
            </div>
        </div>
    );
}

export default ProductDetailModal;