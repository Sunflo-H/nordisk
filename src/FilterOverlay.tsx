type FilterOverlayProps = {
  isActive: boolean;
  toggleFilter: () => void;
};

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isActive,
  toggleFilter,
}) => {
  return (
    <div
      className={`filter-overlay ${isActive ? "active" : ""}`}
      id="filterOverlay"
    >
      <div className="filter-content">
        <h2>필터</h2>
        <label>
          <input type="checkbox" /> 공용
        </label>
        <label>
          <input type="checkbox" /> 남성
        </label>
        <label>
          <input type="checkbox" /> 여성
        </label>
        <label>
          <input type="checkbox" /> 키즈
        </label>
        <button id="closeBtn" onClick={toggleFilter}>
          닫기
        </button>
      </div>
    </div>
  );
};
export default FilterOverlay;
