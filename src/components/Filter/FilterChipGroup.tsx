type FilterChipGroupProps = {
  title: string;
  options: string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
  // 칩별 상품 수 (선택). 넘기면 칩 옆에 "(N)"을 붙이고, 0개 칩은 흐리게 막는다.
  counts?: Record<string, number>;
};

// 필터 칩 한 줄 (예: 연도 27 / 26 / 25 ...)
// 공용 목록의 검색·필터(상품 수 표시)와 행사장 상품 선택 영역(상품 수 없음)이 함께 쓴다.
const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  title,
  options,
  selectedOptions,
  onToggle,
  counts,
}) => {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-14 pt-1 text-sm font-semibold text-gray-600">
        {title}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          const count = counts ? (counts[option] ?? 0) : undefined;
          // 0개 칩은 누를 수 없다. 단, 이미 고른 칩은 0개여도 끌 수 있게 둔다.
          const isDisabled = count === 0 && !isSelected;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onToggle(option)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                isSelected
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-500"
              } ${isDisabled ? "opacity-40 cursor-not-allowed hover:border-gray-300" : ""}`}
            >
              {option}
              {count !== undefined && (
                <span
                  className={`ml-1 text-xs ${
                    isSelected ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterChipGroup;
