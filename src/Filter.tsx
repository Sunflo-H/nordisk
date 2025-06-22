import { useState } from "react";
import FilterToggleBtn from "./FilterToggle";
import FilterOverlay from "./FilterOverlay";

type FilterProps = {};
<div className="filter-container"></div>;
const Filter: React.FC<FilterProps> = () => {
  const [isActive, setIsActive] = useState(false);
  const toggleFilter = () => {
    setIsActive(!isActive);
  };
  return (
    <div className="filter-container">
      <FilterToggleBtn isActive={isActive} toggleFilter={toggleFilter} />
      <FilterOverlay isActive={isActive} toggleFilter={toggleFilter} />
    </div>
  );
};

export default Filter;
// src/Category.tsx
// This component renders a simple category filter for products.
// It includes buttons for different categories like "전체", "의류", "신발", and "액세서리".
