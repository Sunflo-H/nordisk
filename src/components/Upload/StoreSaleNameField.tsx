import { useState } from "react";

type StoreSaleNameFieldProps = {
  value: string;
  onChange: (name: string) => void;
};

// 매장 판매 표시 이름 한 줄 (판매내역 업로드에서 매장 판매를 가려내는 데 쓴다, spec.md Phase 32)
// - 입력돼 있으면 "매장 판매 이름: (이름) [바꾸기]", [바꾸기]를 누르면 입력칸과 [완료]
// - 비어 있으면 처음부터 입력칸
// 실제 이름은 이 브라우저(localStorage)에만 저장한다 (useStoreSaleName). 입력하는 대로 바로 저장된다.
const StoreSaleNameField = ({ value, onChange }: StoreSaleNameFieldProps) => {
  // 처음 열 때 비어 있으면 입력칸부터 보인다 (입력 중에 글자가 생겨도 [완료] 전까지는 입력칸 유지)
  const [isEditing, setIsEditing] = useState(() => value.trim() === "");
  const hasName = value.trim() !== "";

  if (!isEditing) {
    return (
      <div data-testid="store-sale-name-view" className="mt-1 flex items-center gap-2 text-xs text-gray-500">
        <span className="min-w-0 truncate">
          매장 판매 이름: <span className="text-gray-700">{value}</span>
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="ml-auto shrink-0 cursor-pointer text-blue-500 hover:underline"
        >
          바꾸기
        </button>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2 text-xs">
      <label htmlFor="store-sale-name" className="shrink-0 text-gray-500">
        매장 판매 이름
      </label>
      <input
        id="store-sale-name"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hasName) setIsEditing(false);
        }}
        placeholder="엑셀 그대로 (예: 홍*동)"
        autoComplete="off"
        className="min-w-0 flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        disabled={!hasName}
        className="shrink-0 cursor-pointer text-blue-500 hover:underline disabled:text-gray-300 disabled:cursor-not-allowed disabled:no-underline"
      >
        완료
      </button>
    </div>
  );
};

export default StoreSaleNameField;
