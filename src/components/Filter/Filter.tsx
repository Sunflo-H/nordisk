import { useState } from "react";
import FilterToggleBtn from "./FilterToggleBtn";
import FilterOverlay from "./FilterOverlay";
import "./Filter.css";
import type { FilterOptionsType } from "../../types";

type FilterProps = {
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptionsType>>;
};

const Filter: React.FC<FilterProps> = ({ setFilterOptions }) => {
  const [isActive, setIsActive] = useState(false);
  const toggleFilter = () => {
    setIsActive(!isActive);
  };
  return (
    <div className="filter-container">
      <FilterToggleBtn isActive={isActive} toggleFilter={toggleFilter} />
      <FilterOverlay
        isActive={isActive}
        toggleFilter={toggleFilter}
        setFilterOptions={setFilterOptions}
      />
    </div>
  );
};

export default Filter;
// src/Category.tsx
// This component renders a simple category filter for products.
// It includes buttons for different categories like "전체", "의류", "신발", and "액세서리".
