type FilterBlackBoxProps = {
  isActive: boolean;
  // 어두운 배경을 누르면 패널을 닫는다
  onClose: () => void;
};

// 필터 오버레이 모달에 사용되는 검은 배경 박스 컴포넌트입니다.
const FIlterBlackBox: React.FC<FilterBlackBoxProps> = ({ isActive, onClose }) => {
  return (
    <div
      data-testid="filter-backdrop"
      onClick={onClose}
      className={`
              fixed top-0 left-0
              w-screen h-screen
              z-[20]
              transition-all duration-500 ease-in-out
              ${
                isActive
                  ? "pointer-events-auto bg-black/50"
                  : "pointer-events-none bg-transparent"
              }
            `}
    ></div>
  );
};

export default FIlterBlackBox;
