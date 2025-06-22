type CategoryProps = {};

const Category: React.FC<CategoryProps> = () => {
  return (
    <div className="flex justify-center items-center bg-gray-200 p-4">
      <div className="flex space-x-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          전체
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          의류
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          신발
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          액세서리
        </button>
      </div>
    </div>
  );
};

export default Category;
// src/Category.tsx
// This component renders a simple category filter for products.
// It includes buttons for different categories like "전체", "의류", "신발", and "액세서리".
