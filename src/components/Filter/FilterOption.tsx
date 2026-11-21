type FilterOptionProps = {
  title: string;
  options: string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
  // 값별 상품 수 (없는 값은 0개)
  counts: Record<string, number>;
};

const FilterOption: React.FC<FilterOptionProps> = ({
  title,
  options,
  selectedOptions,
  onToggle,
  counts,
}) => {
  return (
    <div className="flex flex-col items-center px-4 border-b border-gray-200 pt-2 pb-3">
      <div className="hidden aw:block w-full text-xl font-bold pb-1">
        {title}
      </div>
      <div className="flex w-full gap-2 flex-wrap ">
        {options.map((option) => {
          const count = counts[option] ?? 0;
          const isSelected = selectedOptions.includes(option);
          // 0개 칩은 누를 수 없다. 단, 이미 골라 둔 칩은 해제할 수 있게 둔다.
          const isDisabled = count === 0 && !isSelected;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              className={` px-4 py-2 aw:px-3 aw:py-1
                rounded-full border border-gray-300
                transition-colors duration-200
                ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:border-blue-500"
                }
                ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700"
                }`}
              onClick={() => onToggle(option)}
            >
              {option}{" "}
              <span
                className={`text-xs ${
                  isSelected ? "text-blue-100" : "text-gray-400"
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterOption;
