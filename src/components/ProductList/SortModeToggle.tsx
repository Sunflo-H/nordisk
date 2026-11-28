import type { ProductSortMode } from "../../utils/productSort";

type SortModeToggleProps = {
  sortMode: ProductSortMode;
  onChange: (mode: ProductSortMode) => void;
};

const sortModeOptions: { mode: ProductSortMode; label: string }[] = [
  { mode: "code", label: "코드순" },
  { mode: "number", label: "숫자순" },
];

// 목록 정렬 선택 버튼 "코드순 / 숫자순" (spec.md "숫자순 정렬"). PC·폰 모두 보인다.
const SortModeToggle: React.FC<SortModeToggleProps> = ({ sortMode, onChange }) => (
  <div
    role="group"
    aria-label="정렬"
    data-testid="sort-mode-toggle"
    className="flex justify-end mb-2"
  >
    <div className="inline-flex p-0.5 text-sm bg-gray-100 border border-gray-200 rounded-lg">
      {sortModeOptions.map(({ mode, label }) => {
        const isSelected = sortMode === mode;
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(mode)}
            className={`px-3 py-1 rounded-md transition-colors ${
              isSelected
                ? "bg-white text-blue-600 font-semibold shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  </div>
);

export default SortModeToggle;
