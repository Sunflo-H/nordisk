const ProductDetailModal=({product, onClose}) => {

    return(
        <div className="fixed inset-0 z-50 bg-white/50 w-40 border-black-1px">
            <div className="font-xl">X</div>
            <div className="flex">
            <div>
                -
            </div>
            <div>COUNT 1</div>
            <div>+</div>
            </div>
        </div>
    );
}

export default ProductDetailModal;