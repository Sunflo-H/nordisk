import { useState } from "react";
import FilterToggleBtn from "./FilterToggleBtn";
import FilterOverlay from "./FilterOverlay";
import type { FilterOptionsType } from "../../types";
import { countSelectedOptions } from "../../utils/productFilter";

// 필터 항목별 값 → 상품 수
export type FilterOptionCounts = Record<
  keyof FilterOptionsType,
  Record<string, number>
>;

type FilterProps = {
  // 지금 적용된 필터 값
  appliedOptions: FilterOptionsType;
  // "적용"을 눌렀을 때 고른 값을 넘긴다
  onApply: (options: FilterOptionsType) => void;
  optionCounts: FilterOptionCounts;
};

// 필터 버튼 + 필터 패널.
// 패널에서 고르는 값(draft)은 "적용"을 눌러야 반영되고, 그냥 닫으면 버린다.
const Filter: React.FC<FilterProps> = ({
  appliedOptions,
  onApply,
  optionCounts,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [draftOptions, setDraftOptions] =
    useState<FilterOptionsType>(appliedOptions);

  // 열 때마다 적용된 값으로 칩을 다시 채운다
  const openFilter = () => {
    setDraftOptions(appliedOptions);
    setIsActive(true);
  };

  const closeFilter = () => {
    setIsActive(false);
  };

  const applyFilter = () => {
    onApply(draftOptions);
    setIsActive(false);
  };

  return (
    <div className="">
      <FilterToggleBtn
        isActive={isActive}
        openFilter={openFilter}
        selectedCount={countSelectedOptions(appliedOptions)}
      />
      <FilterOverlay
        isActive={isActive}
        closeFilter={closeFilter}
        applyFilter={applyFilter}
        draftOptions={draftOptions}
        setDraftOptions={setDraftOptions}
        optionCounts={optionCounts}
      />
    </div>
  );
};

export default Filter;
