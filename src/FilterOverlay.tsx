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
      className={`filter-overlay bg-slate-200 border-b ${
        isActive ? "active" : ""
      }`}
      id="filterOverlay"
    >
      <div>상품 필터</div>
      <div className="filter-content">
        <h2>성별</h2>
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
      </div>
      <div className="filter-content">
        <h2>상품 종류</h2>
        <label>
          <input type="checkbox" /> 상의
        </label>
        <label>
          <input type="checkbox" /> 하의
        </label>
        <label>
          <input type="checkbox" /> 자켓
        </label>
        <label>
          <input type="checkbox" /> 셔츠
        </label>
        <label>
          <input type="checkbox" /> 셔츠
        </label>
        <label>
          <input type="checkbox" /> 셔츠
        </label>
      </div>
      <button id="closeBtn" onClick={toggleFilter}>
        닫기
      </button>
    </div>
  );
};
export default FilterOverlay;
