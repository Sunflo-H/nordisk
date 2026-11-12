import { useRef, useState } from "react";
import {
  deleteData,
  readAllProducts,
  replaceAllProducts,
} from "../../firebase/firebaseDatabase";
import {
  parseInventoryExcel,
  type ParseExcelResult,
} from "../../utils/excelParser";
import {
  summarizeUpload,
  type UploadSummary,
} from "../../utils/uploadSummary";

// 엑셀 업로드·데이터 삭제 버튼 (PC 전용)
// 업로드: 파일 선택 → 검사 → 요약 확인창 → 확인하면 /product 전체 교체 → 저장이 끝난 뒤 결과 알림
const ExcelManager = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // 업로드 처리 중에는 버튼을 막아 중복 저장을 막는다
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 골라도 onChange가 불리도록 선택값을 비워 둔다
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadExcelFile(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = () => {
    fileInputRef.current?.click(); // input 클릭 트리거
  };

  const handleDeleteAllProducts = () => {
    if (confirm("정말 모든 상품 데이터를 삭제하시겠습니까?")) {
      alert("정상적으로 모든 상품 데이터를 삭제했습니다.");
      deleteData();
    } else {
      alert("취소했습니다.");
    }
  };

  return (
    <div className="hidden sm:flex justify-around mb-10 gap-4 ">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleFileInput}
        disabled={isUploading}
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isUploading ? "업로드 중..." : "엑셀 파일 업로드"}
      </button>
      <div
        className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
        onClick={handleDeleteAllProducts}
      >
        데이터 삭제
      </div>
    </div>
  );
};

export default ExcelManager;

// 엑셀 파일 하나를 검사하고, 요약을 보여 준 뒤 확인하면 /product를 통째로 바꾼다.
// 어느 단계에서든 실패하거나 취소하면 DB에 쓰지 않는다.
async function uploadExcelFile(file: File) {
  // 1. 엑셀 읽기 + 필수 열·상품코드 검사
  let parsed: ParseExcelResult;
  try {
    parsed = parseInventoryExcel(await file.arrayBuffer());
  } catch (error) {
    console.error(error);
    alert("엑셀 파일을 읽지 못했습니다. 저장하지 않았습니다.");
    return;
  }
  if (!parsed.ok) {
    alert(`저장하지 않았습니다.\n${parsed.reason}`);
    return;
  }

  // 2. 현재 DB와 비교해 요약 만들기
  let summary: UploadSummary;
  try {
    summary = summarizeUpload(await readAllProducts(), parsed.products);
  } catch (error) {
    console.error(error);
    alert("현재 상품 데이터를 읽지 못했습니다. 저장하지 않았습니다.");
    return;
  }

  // 3. 요약 확인창 (취소하면 끝)
  if (!window.confirm(formatSummary(file.name, summary))) {
    alert("취소했습니다. 상품 데이터는 바뀌지 않았습니다.");
    return;
  }

  // 4. /product 전체 교체 (쓰기 한 번) → 끝난 뒤 결과 알림
  try {
    await replaceAllProducts(parsed.products);
  } catch (error) {
    console.error(error);
    alert("저장에 실패했습니다. 상품 데이터는 업로드 전 그대로입니다.");
    return;
  }
  alert(`저장했습니다. (상품 ${summary.totalCount}개)`);
}

// 요약 확인창 문구. 사라지는 상품은 몇 개만 예로 보여 준다.
function formatSummary(fileName: string, summary: UploadSummary) {
  const { totalCount, addedCodes, removedCodes, changedCodes } = summary;
  const lines = [
    `"${fileName}"의 내용으로 상품 데이터를 통째로 바꿉니다.`,
    "",
    `· 상품 수: ${totalCount}개`,
    `· 새 상품: ${addedCodes.length}개`,
    `· 사라지는 상품: ${removedCodes.length}개`,
    `· 재고·판매가가 바뀐 상품: ${changedCodes.length}개`,
  ];
  if (removedCodes.length > 0) {
    const examples = removedCodes.slice(0, 5).join(", ");
    const more = removedCodes.length > 5 ? ` 외 ${removedCodes.length - 5}개` : "";
    lines.push("", `사라지는 상품: ${examples}${more}`);
  }
  lines.push("", "저장할까요?");
  return lines.join("\n");
}
