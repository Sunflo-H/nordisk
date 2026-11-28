import { useRef, type ReactNode } from "react";
import type { UploadedAtState } from "../../hooks/useUploadStatus";
import { toLocalDateString } from "../../utils/date";

type UploadRowProps = {
  // 줄 이름 (예: "재고 엑셀")
  label: string;
  // ⓘ에 마우스를 올리면 뜨는 설명 (없으면 ⓘ를 그리지 않는다)
  info?: string;
  // 마지막으로 올린 날
  uploadedAt: UploadedAtState;
  // 올리는 중이면 버튼을 막고 "올리는 중..."으로 바꾼다
  isUploading: boolean;
  // [올리기]를 눌렀을 때 파일 선택창을 열기 전에 확인할 것 (false를 돌려주면 열지 않는다)
  beforeOpen?: () => boolean;
  // 파일을 골랐을 때
  onFileSelected: (file: File) => void;
  // 테스트에서 줄을 찾는 이름
  testId: string;
  // 줄 아래에 붙일 내용 (예: 매장 판매 표시 이름)
  children?: ReactNode;
};

// 홈 업로드 묶음의 한 줄: 이름 · ⓘ 설명 · 올린 날 · [올리기] (spec.md Phase 32)
const UploadRow = ({
  label,
  info,
  uploadedAt,
  isUploading,
  beforeOpen,
  onFileSelected,
  testId,
  children,
}: UploadRowProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    if (beforeOpen && !beforeOpen()) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 onChange가 불리도록 선택값을 비워 둔다
    e.target.value = "";
    if (file) onFileSelected(file);
  };

  return (
    <div data-testid={testId} className="py-3 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{label}</span>
        {info && <InfoTip text={info} />}
        <UploadedAtText value={uploadedAt} />
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="shrink-0 cursor-pointer px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isUploading ? "올리는 중..." : "올리기"}
        </button>
      </div>
      {children}
    </div>
  );
};

export default UploadRow;

// ⓘ 말풍선: 마우스를 올리거나 키보드로 고르면 설명이 뜬다
const InfoTip = ({ text }: { text: string }) => (
  <span className="group relative inline-flex">
    <span
      tabIndex={0}
      aria-label="설명 보기"
      className="cursor-help text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
    >
      ⓘ
    </span>
    <span
      role="tooltip"
      className="invisible group-hover:visible group-focus-within:visible absolute left-0 top-5 z-10 w-56 p-2 text-xs leading-relaxed break-keep text-white bg-gray-700 rounded-md shadow-md"
    >
      {text}
    </span>
  </span>
);

// 올린 날 표시: 오늘이면 초록 "MM-DD ✓", 지난 날이면 회색 "MM-DD", 올린 적 없으면 "없음"
const UploadedAtText = ({ value }: { value: UploadedAtState }) => {
  let text: string;
  let color = "text-gray-400";
  if (value === "loading") text = "...";
  else if (value === "error") text = "읽기 실패";
  else if (value === null) text = "없음";
  else if (value === toLocalDateString()) {
    text = `${value.slice(5)} ✓`;
    color = "text-emerald-600 font-semibold";
  } else text = value.slice(5);

  return (
    <span
      data-testid="uploaded-at"
      title={typeof value === "string" && /^\d/.test(value) ? `올린 날 ${value}` : undefined}
      className={`ml-auto text-xs whitespace-nowrap ${color}`}
    >
      {text}
    </span>
  );
};
