import { useRef, useState } from "react";
import {
  SalesDateConflictError,
  readEventCategories,
  readSalesDates,
  saveSalesUpload,
} from "../../firebase/firebaseDatabase";
import { toLocalDateString } from "../../utils/date";
import { planSalesUpload, type SalesUploadPlan } from "../../utils/restockPlan";
import { parseSalesExcel, type ParseSalesResult } from "../../utils/salesParser";

type SalesUploaderProps = {
  // 매장 판매 표시 이름 (비어 있으면 업로드를 막는다)
  storeSaleName: string;
  // 저장에 성공한 뒤 챙길 목록을 다시 읽는다
  onSaved: () => Promise<void>;
};

// 판매내역 업로드 (PC 전용 페이지 안에서만 쓰인다)
// 파일 선택 → 검사·판별 → 미리보기 확인창 → 확인하면 /restock에 쓰기 한 번 → 끝난 뒤 결과 알림
const SalesUploader = ({ storeSaleName, onSaved }: SalesUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // 처리 중에는 버튼을 막아 중복 저장을 막는다
  const [isUploading, setIsUploading] = useState(false);
  const hasStoreSaleName = storeSaleName.trim() !== "";

  const handleButtonClick = () => {
    if (!hasStoreSaleName) {
      alert("매장 판매 표시 이름을 먼저 입력해 주세요.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 onChange가 불리도록 선택값을 비워 둔다
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const saved = await uploadSalesFile(file, storeSaleName);
      if (saved) await onSaved();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="max-w-[480px] mx-auto mt-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <h2 className="font-semibold mb-1">판매내역 업로드</h2>
      <p className="text-sm text-gray-500 mb-3">
        금일상품별판매내역 엑셀을 올리면 행사장 판매를 골라 챙길 목록을
        만듭니다. 이미 저장된 판매일자는 다시 저장하지 않습니다.
      </p>
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
        className="w-full cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isUploading ? "업로드 중..." : "판매내역 엑셀 업로드"}
      </button>
      {!hasStoreSaleName && (
        <p className="text-sm text-red-500 mt-2">
          매장 판매 표시 이름을 입력해야 올릴 수 있습니다.
        </p>
      )}
    </section>
  );
};

export default SalesUploader;

// 판매내역 파일 하나를 검사·판별하고, 미리보기를 보여 준 뒤 확인하면 저장한다.
// 어느 단계에서든 실패하거나 취소하면 DB에 쓰지 않는다. 저장했으면 true를 돌려준다.
async function uploadSalesFile(file: File, storeSaleName: string): Promise<boolean> {
  // 1. 엑셀 읽기 + 필수 열 검사 + 매장 판매 판별 (결과에 고객명 없음)
  let parsed: ParseSalesResult;
  try {
    parsed = parseSalesExcel(await file.arrayBuffer(), storeSaleName);
  } catch (error) {
    console.error(error);
    alert("엑셀 파일을 읽지 못했습니다. 저장하지 않았습니다.");
    return false;
  }
  if (!parsed.ok) {
    alert(`저장하지 않았습니다.\n${parsed.reason}`);
    return false;
  }

  // 2. 행사장 목록·이미 올린 날짜를 읽어 계획 만들기
  let plan: SalesUploadPlan;
  try {
    const [eventCategories, uploadedDates] = await Promise.all([
      readEventCategories(),
      readSalesDates(),
    ]);
    plan = planSalesUpload(
      parsed.lines,
      new Set(Object.keys(eventCategories)),
      uploadedDates,
      toLocalDateString()
    );
  } catch (error) {
    console.error(error);
    alert("행사장 목록이나 올린 판매일자를 읽지 못했습니다. 저장하지 않았습니다.");
    return false;
  }

  if (plan.summaries.length === 0) {
    alert(
      `이 파일의 판매내역은 이미 저장되어 있어 다시 저장하지 않았습니다.\n이미 저장된 판매일자: ${plan.skippedDates.join(", ")}`
    );
    return false;
  }

  // 3. 미리보기 확인창 (취소하면 끝)
  if (!window.confirm(formatPreview(file.name, plan))) {
    alert("취소했습니다. 아무것도 저장하지 않았습니다.");
    return false;
  }

  // 4. 쓰기 한 번으로 저장 → 끝난 뒤 결과 알림
  try {
    await saveSalesUpload(plan);
  } catch (error) {
    console.error(error);
    if (error instanceof SalesDateConflictError) {
      alert(
        `다른 곳에서 같은 날짜를 먼저 저장했습니다. 아무것도 저장하지 않았습니다.\n날짜: ${error.dates.join(", ")}\n새로고침한 뒤 다시 올려 주세요.`
      );
      return false;
    }
    alert("저장에 실패했습니다. 아무것도 저장하지 않았습니다.");
    return false;
  }
  const itemCount = Object.keys(plan.items).length;
  const returnCount = Object.keys(plan.returns).length;
  const lines = [
    `저장했습니다. (판매일자 ${plan.summaries.length}일, 챙길 목록 ${itemCount}개, 반품 확인 ${returnCount}개)`,
  ];
  if (plan.skippedDates.length > 0) {
    lines.push(`이미 저장되어 있어 건너뛴 판매일자: ${plan.skippedDates.join(", ")}`);
  }
  alert(lines.join("\n"));
  return true;
}

// 미리보기 확인창 문구
function formatPreview(fileName: string, plan: SalesUploadPlan) {
  const lines = [`"${fileName}" 판매내역을 저장합니다.`, ""];
  for (const summary of plan.summaries) {
    lines.push(
      `· ${summary.판매일자}: 판매 ${summary.rowCount}줄 / 행사장 판매 ${summary.eventLineCount}줄 → 챙길 목록 ${summary.itemCount}개, 반품 확인 ${summary.returnCount}개`
    );
  }
  if (plan.skippedDates.length > 0) {
    lines.push("", `이미 저장되어 있어 건너뛸 판매일자: ${plan.skippedDates.join(", ")}`);
  }
  lines.push("", "저장할까요?");
  return lines.join("\n");
}
