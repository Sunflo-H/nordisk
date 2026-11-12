type PickerChipGroupProps = {
  title: string;
  options: string[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
};

// 상품 선택 영역의 필터 칩 한 줄 (예: 연도 27 / 26 / 25 ...)
// 필터 오버레이보다 좁은 공간에 펼쳐 두므로 작게 그린다.
const PickerChipGroup: React.FC<PickerChipGroupProps> = ({
  title,
  options,
  selectedOptions,
  onToggle,
}) => {
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 w-14 pt-1 text-sm font-semibold text-gray-600">
        {title}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(option)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                isSelected
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-500"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PickerChipGroup;
